// app/checkout/[orderId]/page.tsx
"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { createClient } from "@/app/lib/supabase/client"
import styles from "./checkout.module.css"
import AppBottomNav from "@/app/components/AppBottomNav"

type FulfillmentMethod = "pickup" | "shipping"

type OrderRow = {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  status: string
  subtotal: number
  shipping_amount: number
  platform_fee: number
  total: number
  fulfillment_method: FulfillmentMethod | null
  fulfillment_selected_at: string | null
  ship_to_name: string | null
  ship_to_line1: string | null
  ship_to_line2: string | null
  ship_to_city: string | null
  ship_to_state: string | null
  ship_to_postal_code: string | null
  ship_to_country: string | null
  shipping_rate_provider: string | null
  shipping_rate_id: string | null
  shipping_carrier: string | null
  shipping_service: string | null
  shipping_estimated_days: number | null
  shipping_rate_expires_at: string | null
}

type ListingRow = {
  id: string
  title: string
  price: number
  fulfillment_type: string
  shipping_price: number | null
  pickup_city: string | null
  pickup_state: string | null
  shipping_rate_mode: string | null
  shipping_origin_zip: string | null
  package_weight_lb: number | null
  package_length_in: number | null
  package_width_in: number | null
  package_height_in: number | null
}

type ListingImageRow = {
  image_url: string
  is_primary: boolean
  sort_order: number
}

type ShippingRateRow = {
  id: string
  provider: string
  provider_rate_id: string | null
  carrier: string
  service: string
  rate_amount: number
  currency: string
  estimated_days: number | null
  expires_at: string | null
  created_at?: string
}

type StripeCheckoutFormProps = {
  order: OrderRow
  listing: ListingRow
  clientSecret: string
}

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey, {
      developerTools: {
        assistant: {
          enabled: false,
        },
      },
    })
  : null

function getPrimaryImage(images: ListingImageRow[]) {
  return [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.sort_order - b.sort_order
  })[0]?.image_url
}

function listingAllowsPickup(listing: ListingRow) {
  return (
    listing.fulfillment_type === "pickup" ||
    listing.fulfillment_type === "pickup_or_shipping"
  )
}

function listingAllowsShipping(listing: ListingRow) {
  return (
    listing.fulfillment_type === "shipping" ||
    listing.fulfillment_type === "pickup_or_shipping"
  )
}

function getFulfillmentLabel(method: string | null) {
  if (method === "shipping") return "Shipping"
  if (method === "pickup") return "Pickup"
  return "Select"
}

function StripeCheckoutForm({
  order,
  listing,
  clientSecret,
}: StripeCheckoutFormProps) {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  const supabase = useMemo(() => createClient(), [])

  const [paying, setPaying] = useState(false)
  const [error, setError] = useState("")

  async function finalizeOrder(paymentIntentId: string) {
    const { error: completeOrderError } = await supabase.rpc(
      "complete_mock_order",
      {
        p_order_id: order.id,
        p_payment_intent_id: paymentIntentId,
      }
    )

    if (completeOrderError) {
      throw new Error(completeOrderError.message)
    }

    const { data: existingConversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("order_id", order.id)
      .maybeSingle()

    let conversationId = existingConversation?.id || ""

    if (!conversationId) {
      const { data: listingConversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("listing_id", order.listing_id)
        .eq("buyer_id", order.buyer_id)
        .maybeSingle()

      if (listingConversation?.id) {
        conversationId = listingConversation.id

        await supabase
          .from("conversations")
          .update({
            order_id: order.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", conversationId)
      }
    }

    if (!conversationId) {
      const { data: newConversation, error: conversationError } = await supabase
        .from("conversations")
        .insert({
          order_id: order.id,
          listing_id: order.listing_id,
          buyer_id: order.buyer_id,
          seller_id: order.seller_id,
        })
        .select("id")
        .single()

      if (conversationError || !newConversation?.id) {
        throw new Error(
          conversationError?.message || "Unable to start order conversation."
        )
      }

      conversationId = newConversation.id
    }

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: order.buyer_id,
      body: `Order confirmed for "${listing.title || "your item"}". 

Use this thread to coordinate pickup, delivery, and any questions with the seller.`,
    })

    await supabase
      .from("conversations")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId)

    router.push(`/orders/${order.id}/confirmation?conversationId=${conversationId}`)
  }

  async function handleStripePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!stripe || !elements) {
      setError("Payment form is still loading.")
      return
    }

    if (order.status === "paid" || order.status === "completed") {
      router.push(`/orders/${order.id}/confirmation`)
      return
    }

    setPaying(true)
    setError("")

    const { error: submitError } = await elements.submit()

    if (submitError) {
      setPaying(false)
      setError(submitError.message || "Please check your payment details.")
      return
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/orders/${order.id}/confirmation`,
      },
      redirect: "if_required",
    })

    if (confirmError) {
      setPaying(false)
      setError(confirmError.message || "Payment could not be completed.")
      return
    }

    if (paymentIntent?.status === "succeeded") {
      try {
        await finalizeOrder(paymentIntent.id)
      } catch (finalizeError) {
        setPaying(false)
        setError(
          finalizeError instanceof Error
            ? finalizeError.message
            : "Payment succeeded, but the order could not be finalized."
        )
      }

      return
    }

    if (paymentIntent?.status === "processing") {
      setError("Payment is processing. Please check your order again shortly.")
      setPaying(false)
      return
    }

    setError("Payment was not completed. Please try again.")
    setPaying(false)
  }

  return (
    <form className={styles.paymentCard} onSubmit={handleStripePayment}>
      <div>
        <p>Secure payment</p>
        <h2>Pay with Stripe</h2>
        <span>Use 4242 4242 4242 4242 while testing in Stripe test mode.</span>
      </div>

      {error ? <div className={styles.errorToast}>{error}</div> : null}

      <div className={styles.trustRow}>
        <span>Secure checkout</span>
        <strong>Powered by Stripe</strong>
      </div>

      <div className={styles.paymentElementBox}>
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      <button type="submit" disabled={paying || !stripe || !elements}>
        {paying ? "Processing..." : `Pay $${Number(order.total || 0).toFixed(2)}`}
      </button>

      <p className={styles.paymentFinePrint}>
        Your payment details are securely processed by Stripe. Decor Encore does
        not store your full card number.
      </p>
    </form>
  )
}

export default function CheckoutPage() {
  const params = useParams()
  const supabase = useMemo(() => createClient(), [])

  const orderId = Array.isArray(params.orderId)
    ? params.orderId[0]
    : params.orderId

  const [order, setOrder] = useState<OrderRow | null>(null)
  const [listing, setListing] = useState<ListingRow | null>(null)
  const [images, setImages] = useState<ListingImageRow[]>([])
  const [clientSecret, setClientSecret] = useState("")
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [fulfillmentSaving, setFulfillmentSaving] = useState(false)
  const [rateLoading, setRateLoading] = useState(false)
  const [shippingRates, setShippingRates] = useState<ShippingRateRow[]>([])
  const [shipToName, setShipToName] = useState("")
  const [shipToLine1, setShipToLine1] = useState("")
  const [shipToLine2, setShipToLine2] = useState("")
  const [shipToCity, setShipToCity] = useState("")
  const [shipToState, setShipToState] = useState("")
  const [shipToPostalCode, setShipToPostalCode] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    async function loadCheckout() {
      if (!orderId) return

      setLoading(true)
      setError("")

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return

      if (!user) {
        setError("Please sign in to continue checkout.")
        setLoading(false)
        return
      }

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(
          "id, listing_id, buyer_id, seller_id, status, subtotal, shipping_amount, platform_fee, total, fulfillment_method, fulfillment_selected_at, ship_to_name, ship_to_line1, ship_to_line2, ship_to_city, ship_to_state, ship_to_postal_code, ship_to_country, shipping_rate_provider, shipping_rate_id, shipping_carrier, shipping_service, shipping_estimated_days, shipping_rate_expires_at"
        )
        .eq("id", orderId)
        .single()

      if (!mounted) return

      if (orderError || !orderData) {
        setError("Order not found.")
        setLoading(false)
        return
      }

      const normalizedOrder = orderData as OrderRow

      if (normalizedOrder.buyer_id !== user.id) {
        setError("You do not have access to this checkout.")
        setLoading(false)
        return
      }

      const { data: listingData, error: listingError } = await supabase
        .from("listings")
        .select(
          "id, title, price, fulfillment_type, shipping_price, pickup_city, pickup_state, shipping_rate_mode, shipping_origin_zip, package_weight_lb, package_length_in, package_width_in, package_height_in"
        )
        .eq("id", normalizedOrder.listing_id)
        .single()

      if (listingError || !listingData) {
        setError("Listing not found.")
        setLoading(false)
        return
      }

      const { data: imageData } = await supabase
        .from("listing_images")
        .select("image_url, is_primary, sort_order")
        .eq("listing_id", normalizedOrder.listing_id)
        .order("sort_order", { ascending: true })

      if (!mounted) return

      setOrder(normalizedOrder)
      setListing(listingData as ListingRow)
      setImages((imageData || []) as ListingImageRow[])

      setShipToName(normalizedOrder.ship_to_name || "")
      setShipToLine1(normalizedOrder.ship_to_line1 || "")
      setShipToLine2(normalizedOrder.ship_to_line2 || "")
      setShipToCity(normalizedOrder.ship_to_city || "")
      setShipToState(normalizedOrder.ship_to_state || "")
      setShipToPostalCode(normalizedOrder.ship_to_postal_code || "")

      setLoading(false)
    }

    loadCheckout()

    return () => {
      mounted = false
    }
  }, [orderId, supabase])

  useEffect(() => {
    let mounted = true

    async function initializePayment() {
      if (!order || clientSecret) return

      if (order.status === "paid" || order.status === "completed") {
        return
      }

      if (!order.fulfillment_method) {
        return
      }

      if (
        order.fulfillment_method === "shipping" &&
        Number(order.shipping_amount || 0) <= 0
      ) {
        return
      }

      setPaymentLoading(true)
      setError("")

      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
        }),
      })

      const payload = await response.json()

      if (!mounted) return

      if (!response.ok) {
        setError(payload.error || "Unable to initialize payment.")
        setPaymentLoading(false)
        return
      }

      setClientSecret(payload.clientSecret || "")
      setPaymentLoading(false)
    }

    initializePayment()

    return () => {
      mounted = false
    }
  }, [order, clientSecret])

  async function updateFulfillment(method: FulfillmentMethod) {
    if (!order || fulfillmentSaving) return

    setFulfillmentSaving(true)
    setError("")
    setClientSecret("")
    setPaymentLoading(false)
    setShippingRates([])

    const response = await fetch(`/api/orders/${order.id}/fulfillment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fulfillmentMethod: method,
      }),
    })

    const payload = await response.json()

    setFulfillmentSaving(false)

    if (!response.ok) {
      setError(payload.error || "Unable to update fulfillment.")
      return
    }

    setOrder(payload.order as OrderRow)
  }

  async function calculateShippingRates() {
  if (!order || rateLoading) return

  setRateLoading(true)
  setError("")
  setClientSecret("")
  setShippingRates([])

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => {
    controller.abort()
  }, 30000)

  try {
    const response = await fetch("/api/shipping/rates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        orderId: order.id,
        shipToName,
        shipToLine1,
        shipToLine2,
        shipToCity,
        shipToState,
        shipToPostalCode,
        shipToCountry: "US",
      }),
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(payload.error || "Unable to calculate shipping rates.")
      setShippingRates([])
      return
    }

    setShippingRates((payload.rates || []) as ShippingRateRow[])
  } catch (shippingError) {
    setError(
      shippingError instanceof DOMException &&
        shippingError.name === "AbortError"
        ? "Shipping rates took too long to respond. Please try again."
        : "Unable to calculate shipping rates."
    )
    setShippingRates([])
  } finally {
    window.clearTimeout(timeoutId)
    setRateLoading(false)
  }
}

  async function selectShippingRate(rateId: string) {
    if (!order || rateLoading) return

    setRateLoading(true)
    setError("")
    setClientSecret("")

    try {
      const response = await fetch(`/api/orders/${order.id}/shipping-rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteId: rateId,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        console.error("Select shipping rate API error:", payload)

        setError(payload.error || "Unable to select shipping rate.")
        return
      }

      setOrder(payload.order as OrderRow)
    } catch (rateError) {
      console.error("Select shipping rate request failed:", rateError)

      setError(
        rateError instanceof Error
          ? rateError.message
          : "Unable to select shipping rate."
      )
    } finally {
      setRateLoading(false)
    }
  }

  if (loading) {
    return (
      <main className={styles.checkoutPage}>
        <section className={styles.stateCard}>
          <h1>Loading checkout</h1>
          <p>Preparing your order.</p>
        </section>
      </main>
    )
  }

  if (error && (!order || !listing)) {
    return (
      <main className={styles.checkoutPage}>
        <section className={styles.stateCard}>
          <h1>Checkout unavailable</h1>
          <p>{error}</p>
          <Link href="/marketplace">Back to marketplace</Link>
        </section>
      </main>
    )
  }

  if (!order || !listing) return null

  const imageUrl = getPrimaryImage(images)
  const subtotalDisplay = Number(order.subtotal || 0).toFixed(2)
  const shippingDisplay = Number(order.shipping_amount || 0).toFixed(2)
  const platformFeeDisplay = Number(order.platform_fee || 0).toFixed(2)
  const totalDisplay = Number(order.total || 0).toFixed(2)

  const canPickup = listingAllowsPickup(listing)
  const canShip = listingAllowsShipping(listing)
  const showFulfillmentSwitch = canPickup && canShip
  const shippingQuoteNeeded =
    order.fulfillment_method === "shipping" &&
    Number(order.shipping_amount || 0) <= 0
  const fulfillmentMissing = !order.fulfillment_method

  return (
    <main className={styles.checkoutPage}>
      {/* <header className={styles.checkoutHeader}>
        <Link href={`/listing/${listing.id}`} className={styles.backLink}>
          Back
        </Link>

        <strong>Decor Encore</strong>
      </header> */}
      <header className={styles.checkoutHeader}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>D</span>
          <span>Decor Encore</span>
        </Link>

        <Link href={`/listing/${listing.id}`} className={styles.headerLink}>
          Listing
        </Link>
      </header>

      <section className={styles.checkoutShell}>
        <section className={styles.summaryCard}>
          <div className={styles.imageWrap}>
            {imageUrl ? (
              <img src={imageUrl} alt={listing.title} />
            ) : (
              <div className={styles.imageFallback} />
            )}
          </div>

          <div className={styles.summaryBody}>
            <p>Order summary</p>
            <h1>{listing.title}</h1>

            <section className={styles.fulfillmentCard}>
              <div className={styles.fulfillmentHeader}>
                <span>Fulfillment</span>
                <strong>{getFulfillmentLabel(order.fulfillment_method)}</strong>
              </div>

              {showFulfillmentSwitch ? (
                <div
                  className={styles.fulfillmentChoiceSwitch}
                  role="tablist"
                  aria-label="Choose fulfillment"
                >
                  <button
                    type="button"
                    className={
                      order.fulfillment_method === "pickup" ? styles.fulfillmentActive : ""
                    }
                    onClick={() => updateFulfillment("pickup")}
                    disabled={fulfillmentSaving}
                    role="tab"
                    aria-selected={order.fulfillment_method === "pickup"}
                  >
                    Pickup
                  </button>

                  <button
                    type="button"
                    className={
                      order.fulfillment_method === "shipping"
                        ? styles.fulfillmentActive
                        : ""
                    }
                    onClick={() => updateFulfillment("shipping")}
                    disabled={fulfillmentSaving}
                    role="tab"
                    aria-selected={order.fulfillment_method === "shipping"}
                  >
                    Ship
                  </button>

                  <span
                    className={`${styles.fulfillmentChoiceSlider} ${
                      order.fulfillment_method === "shipping"
                        ? styles.fulfillmentChoiceRight
                        : styles.fulfillmentChoiceLeft
                    }`}
                  />
                </div>
              ) : (
                <div className={styles.fulfillmentStatic}>
                  <span>
                    {canShip && !canPickup
                      ? "This listing ships to the buyer."
                      : "This listing is available for pickup."}
                  </span>
                </div>
              )}

              {order.fulfillment_method === "pickup" ? (
                <p className={styles.fulfillmentNote}>
                  Coordinate pickup details with the seller after checkout.
                </p>
              ) : null}

              {shippingQuoteNeeded ? (
                <div className={styles.shippingRatePanel}>
                  <p className={styles.fulfillmentWarning}>
                    Enter your shipping address to calculate available rates before payment.
                  </p>

                  <div className={styles.shippingAddressGrid}>
                    <label>
                      <span>Name</span>
                      <input
                        value={shipToName}
                        onChange={(event) => setShipToName(event.target.value)}
                        placeholder="Full name"
                      />
                    </label>

                    <label>
                      <span>Address</span>
                      <input
                        value={shipToLine1}
                        onChange={(event) => setShipToLine1(event.target.value)}
                        placeholder="Street address"
                      />
                    </label>

                    <label>
                      <span>Apt / Suite</span>
                      <input
                        value={shipToLine2}
                        onChange={(event) => setShipToLine2(event.target.value)}
                        placeholder="Optional"
                      />
                    </label>

                    <label>
                      <span>City</span>
                      <input
                        value={shipToCity}
                        onChange={(event) => setShipToCity(event.target.value)}
                        placeholder="City"
                      />
                    </label>

                    <label>
                      <span>State</span>
                      <input
                        value={shipToState}
                        onChange={(event) =>
                          setShipToState(event.target.value.toUpperCase().slice(0, 2))
                        }
                        placeholder="FL"
                        maxLength={2}
                      />
                    </label>

                    <label>
                      <span>ZIP</span>
                      <input
                        value={shipToPostalCode}
                        onChange={(event) => setShipToPostalCode(event.target.value)}
                        placeholder="33602"
                        inputMode="numeric"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    className={styles.calculateShippingButton}
                    onClick={calculateShippingRates}
                    disabled={rateLoading}
                  >
                    {rateLoading ? "Calculating..." : "Calculate shipping"}
                  </button>

                  {shippingRates.length > 0 ? (
                    <div className={styles.shippingRateList}>
                      {shippingRates.map((rate) => {
                        const isSelected =
                          order.shipping_rate_id === rate.provider_rate_id ||
                          order.shipping_rate_id === rate.id

                        return (
                          <button
                            key={rate.id}
                            type="button"
                            className={isSelected ? styles.shippingRateSelected : ""}
                            onClick={() => selectShippingRate(rate.id)}
                            disabled={rateLoading}
                          >
                            <span>
                              <strong>{rate.carrier}</strong>
                              <em>{rate.service}</em>
                            </span>

                            <b>${Number(rate.rate_amount || 0).toFixed(2)}</b>
                          </button>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {order.fulfillment_method === "shipping" &&
              Number(order.shipping_amount || 0) > 0 ? (
                <p className={styles.fulfillmentNote}>
                  Selected rate: {order.shipping_carrier} {order.shipping_service}
                  {order.shipping_estimated_days
                    ? ` · estimated ${order.shipping_estimated_days} day${
                        order.shipping_estimated_days === 1 ? "" : "s"
                      }`
                    : ""}
                </p>
              ) : null}

              {fulfillmentSaving ? (
                <p className={styles.fulfillmentNote}>Updating fulfillment...</p>
              ) : null}
            </section>

            <div className={styles.checkoutReceipt}>
              <div className={styles.checkoutReceiptLine}>
                <span>Subtotal</span>
                <strong>${subtotalDisplay}</strong>
              </div>

              {order.fulfillment_method ? (
                <div className={styles.checkoutReceiptLine}>
                  <span>Method</span>
                  <strong>{getFulfillmentLabel(order.fulfillment_method)}</strong>
                </div>
              ) : null}

              {order.fulfillment_method === "shipping" ? (
                <div className={styles.checkoutReceiptLine}>
                  <span>Shipping</span>
                  <strong>
                    {Number(order.shipping_amount || 0) > 0
                      ? `$${shippingDisplay}`
                      : "Pending"}
                  </strong>
                </div>
              ) : null}

              <div className={styles.checkoutReceiptLine}>
                <span>Platform fee</span>
                <strong>${platformFeeDisplay}</strong>
              </div>

              <div className={styles.checkoutReceiptDivider} />

              <div className={styles.checkoutReceiptTotal}>
                <span>Total</span>
                <strong>${totalDisplay}</strong>
              </div>
            </div>
          </div>
        </section>

        {error ? <div className={styles.errorToast}>{error}</div> : null}

        {order.status === "paid" || order.status === "completed" ? (
          <section className={styles.paymentCard}>
            <div>
              <p>Already paid</p>
              <h2>Order complete</h2>
              <span>This order has already been paid.</span>
            </div>

            <Link
              href={`/orders/${order.id}/confirmation`}
              className={styles.paidLink}
            >
              View order
            </Link>
          </section>
        ) : fulfillmentMissing ? (
          <section className={styles.paymentCard}>
            <div>
              <p>Fulfillment needed</p>
              <h2>Choose a method</h2>
              <span>Select pickup or shipping before payment.</span>
            </div>
          </section>
        ) : shippingQuoteNeeded ? (
          <section className={styles.paymentCard}>
            <div>
              <p>Shipping quote needed</p>
              <h2>Shipping rates are next</h2>
              <span>
                Shipping checkout needs a calculated rate before payment can be
                processed.
              </span>
            </div>
          </section>
        ) : paymentLoading ? (
          <section className={styles.paymentCard}>
            <div>
              <p>Secure payment</p>
              <h2>Loading payment</h2>
              <span>Preparing Stripe checkout.</span>
            </div>
          </section>
        ) : clientSecret && stripePromise ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#512d38",
                  colorText: "#512d38",
                  colorDanger: "#9f1239",
                  colorBackground: "rgba(255, 255, 255, 0.72)",
                  borderRadius: "18px",
                  fontFamily:
                    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                },
              },
            }}
          >
            <StripeCheckoutForm
              order={order}
              listing={listing}
              clientSecret={clientSecret}
            />
          </Elements>
        ) : (
          <section className={styles.paymentCard}>
            <div>
              <p>Payment unavailable</p>
              <h2>Stripe could not load</h2>
              <span>
                Check that NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is configured.
              </span>
            </div>
          </section>
        )}
      </section>
      <AppBottomNav
          active="shop"
          items={[
            {
              key: "shop",
              label: "Shop",
              href: "/marketplace",
            },
            {
              key: "messages",
              label: "Messages",
              href: "/messages",
            },
            {
              key: "profile",
              label: "Profile",
              href: "/profile",
            },
          ]}
        />
    </main>
  )
}