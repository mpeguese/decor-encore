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
}

type ListingRow = {
  id: string
  title: string
  price: number
  fulfillment_type: string
  shipping_price: number | null
  pickup_city: string | null
  pickup_state: string | null
}

type ListingImageRow = {
  image_url: string
  is_primary: boolean
  sort_order: number
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
          "id, listing_id, buyer_id, seller_id, status, subtotal, shipping_amount, platform_fee, total"
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
          "id, title, price, fulfillment_type, shipping_price, pickup_city, pickup_state"
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

            <div className={styles.checkoutReceipt}>
              <div className={styles.checkoutReceiptLine}>
                <span>Subtotal</span>
                <strong>${subtotalDisplay}</strong>
              </div>

              {Number(order.shipping_amount || 0) > 0 ? (
                <div className={styles.checkoutReceiptLine}>
                  <span>Shipping</span>
                  <strong>${shippingDisplay}</strong>
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