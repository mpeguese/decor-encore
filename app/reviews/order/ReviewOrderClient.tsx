// app/reviews/order/ReviewOrderClient.tsx
"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/app/lib/supabase/client"
import styles from "@/app/seller/orders/seller-orders.module.css"
import AppBottomNav from "@/app/components/AppBottomNav"

type ListingImageRow = {
  image_url: string
  is_primary: boolean
  sort_order: number
}

type OrderRow = {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  status: string
  total: number
  created_at: string
  listings:
    | {
        title: string
        listing_images: ListingImageRow[] | null
      }
    | {
        title: string
        listing_images: ListingImageRow[] | null
      }[]
    | null
}

type ReviewType = "buyer_to_seller" | "seller_to_buyer"

type ReviewRow = {
  id: string
  order_id: string
  reviewer_id: string
  review_type: ReviewType
}

function getListing(order: OrderRow) {
  if (Array.isArray(order.listings)) {
    return order.listings[0] || null
  }

  return order.listings || null
}

function getPrimaryImage(order: OrderRow) {
  const listing = getListing(order)
  const images = listing?.listing_images || []

  return [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.sort_order - b.sort_order
  })[0]?.image_url
}

function buildConfirmationNumber(orderId: string) {
  const clean = orderId.replace(/-/g, "").toUpperCase()
  return `DE-${clean.slice(0, 4)}-${clean.slice(-6)}`
}

function getRatingButtons(value: number, onChange: (next: number) => void) {
  return (
    <div className={styles.reviewRatingRow}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          className={rating <= value ? styles.reviewRatingActive : ""}
          onClick={() => onChange(rating)}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function ReviewOrderClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])

  const orderId = searchParams.get("orderId") || ""

  const [userId, setUserId] = useState("")
  const [order, setOrder] = useState<OrderRow | null>(null)
  const [reviewType, setReviewType] = useState<ReviewType | "">("")
  const [existingReview, setExistingReview] = useState<ReviewRow | null>(null)

  const [rating, setRating] = useState(0)
  const [communicationRating, setCommunicationRating] = useState(0)
  const [expectationRating, setExpectationRating] = useState(0)
  const [fulfillmentRating, setFulfillmentRating] = useState(0)
  const [wouldRecommend, setWouldRecommend] = useState(true)
  const [comment, setComment] = useState("")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadReviewOrder() {
      setLoading(true)
      setError("")

      if (!orderId) {
        setError("Missing order ID.")
        setLoading(false)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return

      if (!user) {
        router.replace(`/login?next=/reviews/order?orderId=${orderId}`)
        return
      }

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(
          `
          id,
          listing_id,
          buyer_id,
          seller_id,
          status,
          total,
          created_at,
          listings (
            title,
            listing_images (
              image_url,
              is_primary,
              sort_order
            )
          )
        `
        )
        .eq("id", orderId)
        .single()

      if (!mounted) return

      if (orderError || !orderData) {
        setError("Order not found.")
        setLoading(false)
        return
      }

      const normalizedOrder = orderData as unknown as OrderRow

      if (normalizedOrder.buyer_id !== user.id && normalizedOrder.seller_id !== user.id) {
        setError("You do not have access to review this order.")
        setLoading(false)
        return
      }

      const nextReviewType =
        normalizedOrder.buyer_id === user.id ? "buyer_to_seller" : "seller_to_buyer"

      const { data: reviewData } = await supabase
        .from("order_reviews")
        .select("id, order_id, reviewer_id, review_type")
        .eq("order_id", normalizedOrder.id)
        .eq("reviewer_id", user.id)
        .maybeSingle()

      if (!mounted) return

      setUserId(user.id)
      setOrder(normalizedOrder)
      setReviewType(nextReviewType)
      setExistingReview((reviewData || null) as ReviewRow | null)
      setLoading(false)
    }

    loadReviewOrder()

    return () => {
      mounted = false
    }
  }, [orderId, router, supabase])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!order || !userId) return

    if (
      rating < 1 ||
      communicationRating < 1 ||
      expectationRating < 1 ||
      fulfillmentRating < 1
    ) {
      setError("Please select a rating for each section.")
      return
    }

    setSaving(true)
    setError("")
    setSuccess(false)

    const { error: rpcError } = await supabase.rpc("submit_order_review", {
      p_order_id: order.id,
      p_rating: rating,
      p_communication_rating: communicationRating,
      p_expectation_rating: expectationRating,
      p_fulfillment_rating: fulfillmentRating,
      p_would_recommend: wouldRecommend,
      p_comment: comment.trim(),
    })

    setSaving(false)

    if (rpcError) {
      setError(rpcError.message)
      return
    }

    setSuccess(true)
    setExistingReview({
      id: "submitted",
      order_id: order.id,
      reviewer_id: userId,
      review_type: reviewType as ReviewType,
    })
  }

  if (loading) {
    return (
      <main className={styles.sellerOrdersPage}>
        <section className={styles.stateCard}>
          <h2>Loading review</h2>
          <p>Getting order review details.</p>
        </section>
      </main>
    )
  }

  if (error && !order) {
    return (
      <main className={styles.sellerOrdersPage}>
        <section className={styles.stateCard}>
          <h2>Review unavailable</h2>
          <p>{error}</p>
          <Link href="/orders">Back to orders</Link>
        </section>
      </main>
    )
  }

  if (!order) {
    return (
      <main className={styles.sellerOrdersPage}>
        <section className={styles.stateCard}>
          <h2>Review unavailable</h2>
          <p>This order could not be loaded.</p>
          <Link href="/orders">Back to orders</Link>
        </section>
      </main>
    )
  }

  const listing = getListing(order)
  const imageUrl = getPrimaryImage(order)
  const isBuyerReview = reviewType === "buyer_to_seller"
  const detailHref = isBuyerReview
    ? `/orders/${order.id}/confirmation`
    : `/seller/orders/${order.id}`

  const reviewTitle = isBuyerReview ? "Review seller" : "Review buyer"
  const communicationLabel = "Communication"
  const expectationLabel = isBuyerReview ? "Item matched listing" : "Order follow-through"
  const fulfillmentLabel = "Pickup / delivery experience"
  const recommendLabel = isBuyerReview ? "Would buy from again" : "Would sell to again"

  return (
    <main className={styles.sellerOrdersPage}>
      <header className={styles.sellerOrdersHeader}>
        
        {/* <Link href={detailHref} className={styles.backLink}>
          Back
        </Link>

        <strong>Decor Encore</strong>

        <Link href={isBuyerReview ? "/orders" : "/seller/orders"} className={styles.headerAction}>
          Orders
        </Link> */}
      </header>

      <section className={styles.sellerOrdersShell}>
        <div className={styles.sellerOrdersIntro}>
          <p>Completed order</p>
          <h1>{reviewTitle}</h1>
          <span>{buildConfirmationNumber(order.id)}</span>
        </div>

        <article className={styles.orderCard}>
          <div className={styles.orderImage}>
            {imageUrl ? (
              <img src={imageUrl} alt={listing?.title || "Reviewed item"} />
            ) : (
              <span>D</span>
            )}
          </div>

          <div className={styles.orderContent}>
            <div className={styles.orderTopLine}>
              <span>{order.status}</span>
              <strong>${Number(order.total || 0).toFixed(2)}</strong>
            </div>

            <h2>{listing?.title || "Decor listing"}</h2>
          </div>
        </article>

        <form className={styles.reviewCard} onSubmit={handleSubmit}>
          <div className={styles.reviewHeader}>
            <div>
              <h2>
                {existingReview ? "Review submitted" : "How did it go?"}
              </h2>
            </div>
          </div>

          {order.status !== "completed" ? (
            <p className={styles.reviewNote}>
              Reviews are available after the order is completed.
            </p>
          ) : existingReview ? (
            <p className={styles.reviewNote}>
              You already reviewed this order.
            </p>
          ) : (
            <>
              <label className={styles.reviewField}>
                <span>Overall rating</span>
                {getRatingButtons(rating, setRating)}
              </label>

              <label className={styles.reviewField}>
                <span>{communicationLabel}</span>
                {getRatingButtons(communicationRating, setCommunicationRating)}
              </label>

              <label className={styles.reviewField}>
                <span>{expectationLabel}</span>
                {getRatingButtons(expectationRating, setExpectationRating)}
              </label>

              <label className={styles.reviewField}>
                <span>{fulfillmentLabel}</span>
                {getRatingButtons(fulfillmentRating, setFulfillmentRating)}
              </label>

              <label className={styles.reviewToggle}>
                <span>{recommendLabel}</span>
                <input
                  type="checkbox"
                  checked={wouldRecommend}
                  onChange={(event) => setWouldRecommend(event.target.checked)}
                />
              </label>

              <label className={styles.reviewField}>
                <span>Optional note</span>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Share a short note about the experience."
                  rows={5}
                />
              </label>

              {error ? <p className={styles.reviewError}>{error}</p> : null}
              {success ? <p className={styles.reviewSuccess}>Review submitted.</p> : null}

              <div className={styles.reviewActions}>
                <button type="submit" disabled={saving}>
                  {saving ? "Submitting..." : "Submit review"}
                </button>

                {/* <Link href={detailHref}>Back to order</Link> */}
              </div>
            </>
          )}
        </form>
      </section>

      <AppBottomNav
        active="orders"
        items={[
          {
            key: "orders",
            label: "Orders",
            href: isBuyerReview ? "/orders" : "/seller/orders",
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