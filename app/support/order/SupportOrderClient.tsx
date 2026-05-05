// app/support/order/SupportOrderClient.tsx
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
        price: number
        listing_images: ListingImageRow[] | null
      }
    | {
        title: string
        price: number
        listing_images: ListingImageRow[] | null
      }[]
    | null
}

type RequesterRole = "buyer" | "seller"

const issueOptions = [
  {
    value: "order_question",
    label: "I have a question about this order",
  },
  {
    value: "cancel_order",
    label: "I need to cancel",
  },
  {
    value: "pickup_delivery_issue",
    label: "Pickup or delivery issue",
  },
  {
    value: "payment_issue",
    label: "Payment issue",
  },
  {
    value: "item_not_as_described",
    label: "Item was not as described",
  },
  {
    value: "not_responding",
    label: "Buyer/seller is not responding",
  },
  {
    value: "other",
    label: "Other",
  },
]

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

function formatStatus(value: string) {
  const labels: Record<string, string> = {
    pending: "Pending",
    paid: "Paid",
    cancelled: "Cancelled",
    refunded: "Refunded",
    completed: "Completed",
  }

  return labels[value] || value
}

export default function SupportOrderClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])

  const orderId = searchParams.get("orderId") || ""

  const [userId, setUserId] = useState("")
  const [order, setOrder] = useState<OrderRow | null>(null)
  const [requesterRole, setRequesterRole] = useState<RequesterRole | "">("")
  const [issueType, setIssueType] = useState("order_question")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadOrderForSupport() {
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
        router.replace(`/login?next=/support/order?orderId=${orderId}`)
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
            price,
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
      const role =
        normalizedOrder.buyer_id === user.id
          ? "buyer"
          : normalizedOrder.seller_id === user.id
          ? "seller"
          : ""

      if (!role) {
        setError("You do not have access to support for this order.")
        setLoading(false)
        return
      }

      setUserId(user.id)
      setOrder(normalizedOrder)
      setRequesterRole(role)
      setLoading(false)
    }

    loadOrderForSupport()

    return () => {
      mounted = false
    }
  }, [orderId, router, supabase])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!order || !userId || !requesterRole) return

    const cleanMessage = message.trim()

    if (!cleanMessage) {
      setError("Please describe what you need help with.")
      return
    }

    setSubmitting(true)
    setError("")
    setSuccess(false)

    const { error: insertError } = await supabase
      .from("order_support_requests")
      .insert({
        order_id: order.id,
        listing_id: order.listing_id,
        requester_id: userId,
        buyer_id: order.buyer_id,
        seller_id: order.seller_id,
        requester_role: requesterRole,
        issue_type: issueType,
        message: cleanMessage,
        status: "open",
      })

    setSubmitting(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setMessage("")
    setIssueType("order_question")
    setSuccess(true)
  }

  if (loading) {
    return (
      <main className={styles.sellerOrdersPage}>
        <section className={styles.stateCard}>
          <h2>Loading support</h2>
          <p>Getting order help details.</p>
        </section>
      </main>
    )
  }

  if (error && !order) {
    return (
      <main className={styles.sellerOrdersPage}>
        <section className={styles.stateCard}>
          <h2>Support unavailable</h2>
          <p>{error}</p>
          <Link href="/profile">Back to profile</Link>
        </section>
      </main>
    )
  }

  if (!order) {
    return (
      <main className={styles.sellerOrdersPage}>
        <section className={styles.stateCard}>
          <h2>Support unavailable</h2>
          <p>This order could not be loaded.</p>
          <Link href="/profile">Back to profile</Link>
        </section>
      </main>
    )
  }

  const listing = getListing(order)
  const imageUrl = getPrimaryImage(order)
  const backHref = requesterRole === "seller" ? "/seller/orders" : "/orders"
  const detailHref =
    requesterRole === "seller"
      ? `/seller/orders/${order.id}`
      : `/orders/${order.id}/confirmation`

  return (
    <main className={styles.sellerOrdersPage}>
      <header className={styles.sellerOrdersHeader}>
        <Link href={detailHref} className={styles.backLink}>
          Back
        </Link>

        <strong>Decor Encore</strong>

        <Link href={backHref} className={styles.headerAction}>
          Orders
        </Link>
      </header>

      <section className={styles.sellerOrdersShell}>
        <div className={styles.sellerOrdersIntro}>
          <p>Order help</p>
          <h1>{buildConfirmationNumber(order.id)}</h1>
          <span>
            Tell us what is happening with this order so Decor Encore support can
            review it.
          </span>
        </div>

        <article className={styles.orderCard}>
          <div className={styles.orderImage}>
            {imageUrl ? (
              <img src={imageUrl} alt={listing?.title || "Order item"} />
            ) : (
              <span>D</span>
            )}
          </div>

          <div className={styles.orderContent}>
            <div className={styles.orderTopLine}>
              <span>{formatStatus(order.status)}</span>
              <strong>${Number(order.total || 0).toFixed(2)}</strong>
            </div>

            <h2>{listing?.title || "Decor listing"}</h2>

            <div className={styles.orderDetails}>
              <div>
                <span>Role</span>
                <strong>
                  {requesterRole === "seller" ? "Seller" : "Buyer"}
                </strong>
              </div>

              <div>
                <span>Order</span>
                <strong>{buildConfirmationNumber(order.id)}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{formatStatus(order.status)}</strong>
              </div>
            </div>
          </div>
        </article>

        <form className={`${styles.stateCard} ${styles.supportForm}`} onSubmit={handleSubmit}>
            <h2>What do you need help with?</h2>

            <label className={styles.supportField}>
                <span>Issue type</span>
                <select
                className={styles.supportSelect}
                value={issueType}
                onChange={(event) => setIssueType(event.target.value)}
                disabled={submitting || success}
                >
                {issueOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                    {option.label}
                    </option>
                ))}
                </select>
            </label>

            <label className={styles.supportField}>
                <span>Message</span>
                <textarea
                className={styles.supportTextarea}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Share the details Decor Encore support should know."
                rows={6}
                disabled={submitting || success}
                />
            </label>

            {error ? <p className={styles.supportError}>{error}</p> : null}

            {success ? (
                <p className={styles.supportSuccess}>
                Your request was sent. Decor Encore support will review this order.
                </p>
            ) : null}

            <div className={styles.supportActions}>
                <button type="submit" disabled={submitting || success}>
                {submitting ? "Sending..." : "Submit request"}
                </button>

                {/* <Link href={detailHref}>Back to order</Link> */}
            </div>
        </form>
        <AppBottomNav
            active="support"
            items={[
                {
                key: "orders",
                label: "Orders",
                href: backHref,
                },
                {
                key: "support",
                label: "Help",
                href: `/support/order?orderId=${order.id}`,
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
      </section>
    </main>
  )
}