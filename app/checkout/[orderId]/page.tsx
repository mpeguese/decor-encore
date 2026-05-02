"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { createClient } from "@/app/lib/supabase/client"
import styles from "./checkout.module.css"

type OrderRow = {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  status: string
  subtotal: number
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

function getPrimaryImage(images: ListingImageRow[]) {
  return [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.sort_order - b.sort_order
  })[0]?.image_url
}

function formatCardNumber(value: string) {
  const digitsOnly = value.replace(/\D/g, "").slice(0, 16)

  return digitsOnly.replace(/(.{4})/g, "$1 ").trim()
}

function formatExpiration(value: string) {
  const digitsOnly = value.replace(/\D/g, "").slice(0, 4)

  if (digitsOnly.length <= 2) {
    return digitsOnly
  }

  return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`
}

function digitsOnly(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength)
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const orderId = Array.isArray(params.orderId)
    ? params.orderId[0]
    : params.orderId

  const [order, setOrder] = useState<OrderRow | null>(null)
  const [listing, setListing] = useState<ListingRow | null>(null)
  const [images, setImages] = useState<ListingImageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState("")

  const [cardNumber, setCardNumber] = useState("")
  const [expiration, setExpiration] = useState("")
  const [cvc, setCvc] = useState("")
  const [zip, setZip] = useState("")

  useEffect(() => {
    let mounted = true

    async function loadCheckout() {
      if (!orderId) return

      setLoading(true)
      setError("")

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Please sign in to continue checkout.")
        setLoading(false)
        return
      }

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(
          "id, listing_id, buyer_id, seller_id, status, subtotal, platform_fee, total"
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

  async function handleMockPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!order) return

    const cardDigits = cardNumber.replace(/\D/g, "")
    const expirationDigits = expiration.replace(/\D/g, "")

    if (cardDigits.length !== 16) {
      setError("Enter a valid 16-digit test card number.")
      return
    }

    if (expirationDigits.length !== 4) {
      setError("Enter an expiration date in MM/YY format.")
      return
    }

    if (cvc.length !== 3) {
      setError("Enter a valid 3-digit CVC.")
      return
    }

    if (zip.length !== 5) {
      setError("Enter a valid 5-digit billing ZIP code.")
      return
    }

    setPaying(true)
    setError("")

    const mockPaymentIntentId = `mock_pi_${Date.now()}`

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        stripe_payment_intent_id: mockPaymentIntentId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)

    if (updateError) {
      setPaying(false)
      setError(updateError.message)
      return
    }

    await supabase.from("order_events").insert({
      order_id: order.id,
      event_type: "mock_payment_completed",
      note: "Mock checkout completed successfully.",
    })

    router.push(`/orders/${order.id}/confirmation`)
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

  return (
    <main className={styles.checkoutPage}>
      <header className={styles.checkoutHeader}>
        <Link href={`/listing/${listing.id}`} className={styles.backLink}>
          Back
        </Link>

        <strong>Decor Encore</strong>
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

            <div className={styles.priceRows}>
              <div>
                <span>Subtotal</span>
                <strong>${Number(order.subtotal || 0).toFixed(0)}</strong>
              </div>

              <div>
                <span>Platform fee</span>
                <strong>${Number(order.platform_fee || 0).toFixed(0)}</strong>
              </div>

              <div className={styles.totalRow}>
                <span>Total</span>
                <strong>${Number(order.total || 0).toFixed(0)}</strong>
              </div>
            </div>
          </div>
        </section>

        <form className={styles.paymentCard} onSubmit={handleMockPayment}>
          <div>
            <p>Mock payment</p>
            <h2>Pay with test card</h2>
            <span>Use 4242 4242 4242 4242 for testing.</span>
          </div>

          {error ? <div className={styles.errorToast}>{error}</div> : null}

          <label>
            Card number
            <input
              value={cardNumber}
              onChange={(event) => {
                setCardNumber(formatCardNumber(event.target.value))
                if (error) setError("")
              }}
              placeholder="4242 4242 4242 4242"
              inputMode="numeric"
              autoComplete="cc-number"
              maxLength={19}
            />
          </label>

          <div className={styles.fieldGrid}>
            <label>
              Expiration
              <input
                value={expiration}
                onChange={(event) => {
                  setExpiration(formatExpiration(event.target.value))
                  if (error) setError("")
                }}
                placeholder="12/30"
                inputMode="numeric"
                autoComplete="cc-exp"
                maxLength={5}
              />
            </label>

            <label>
              CVC
              <input
                value={cvc}
                onChange={(event) => {
                  setCvc(digitsOnly(event.target.value, 3))
                  if (error) setError("")
                }}
                placeholder="123"
                inputMode="numeric"
                autoComplete="cc-csc"
                maxLength={3}
              />
            </label>
          </div>

          <label>
            Billing ZIP
            <input
              value={zip}
              onChange={(event) => {
                setZip(digitsOnly(event.target.value, 5))
                if (error) setError("")
              }}
              placeholder="12345"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={5}
            />
          </label>

          <button type="submit" disabled={paying || order.status === "paid"}>
            {order.status === "paid"
              ? "Already paid"
              : paying
                ? "Processing..."
                : `Pay $${Number(order.total || 0).toFixed(0)}`}
          </button>
        </form>
      </section>
    </main>
  )
}