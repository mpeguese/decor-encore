// app/seller/orders/[orderId]/page.tsx
"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/app/lib/supabase/client"
import styles from "../seller-orders.module.css"

type ListingImageRow = {
  image_url: string
  is_primary: boolean
  sort_order: number
}

type OrderStatus =
  | "pending"
  | "paid"
  | "confirmed"
  | "arranged"
  | "completed"
  | "cancelled"
  | "refunded"
  | "disputed"

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

type ProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
}

type ConversationRow = {
  id: string
  order_id: string | null
}

type OrderEventRow = {
  id: string
  order_id: string
  event_type: string
  note: string | null
  created_at: string
}

type StageAction = {
  nextStatus: "confirmed" | "arranged" | "completed" | "cancelled"
  label: string
  helper: string
  variant?: "primary" | "danger"
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

function getProfileName(profile: ProfileRow | null) {
  if (!profile) return "Buyer"

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ")

  return name || profile.full_name || "Buyer"
}

function buildConfirmationNumber(orderId: string) {
  const clean = orderId.replace(/-/g, "").toUpperCase()
  return `DE-${clean.slice(0, 4)}-${clean.slice(-6)}`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

function formatStatus(value: string) {
  const labels: Record<string, string> = {
    pending: "Pending",
    paid: "Paid",
    confirmed: "Confirmed",
    arranged: "Pickup / Delivery Arranged",
    completed: "Completed",
    cancelled: "Cancelled",
    refunded: "Refunded",
    disputed: "Disputed",
  }

  return labels[value] || value
}

function formatTimelineLabel(eventType: string) {
  const labels: Record<string, string> = {
    order_created: "Order placed",
    payment_received: "Payment received",
    seller_confirmed: "Seller confirmed",
    pickup_delivery_arranged: "Pickup / delivery arranged",
    buyer_reviewed_seller: "Buyer reviewed seller",
    seller_reviewed_buyer: "Seller reviewed buyer",
    order_completed: "Completed",
    order_cancelled: "Cancelled",
    support_requested: "Help requested",
    refund_requested: "Refund requested",
    refund_processed: "Refund processed",
  }

  return labels[eventType] || eventType.replace(/_/g, " ")
}

function buildTimelineEvents(order: OrderRow, events: OrderEventRow[]) {
  if (events.length > 0) {
    return events.map((event) => ({
      id: event.id,
      label: formatTimelineLabel(event.event_type),
      note: event.note || "",
      created_at: event.created_at,
    }))
  }

  return [
    {
      id: `fallback-${order.id}`,
      label: "Order placed",
      note: "This order was created.",
      created_at: order.created_at,
    },
  ]
}

function getSellerStageActions(status: string): StageAction[] {
  if (status === "pending" || status === "paid") {
    return [
      {
        nextStatus: "confirmed",
        label: "Confirm order",
        helper: "Let the buyer know this sale is confirmed.",
        variant: "primary",
      },
      {
        nextStatus: "cancelled",
        label: "Cancel order",
        helper: "Use only if this order cannot be fulfilled.",
        variant: "danger",
      },
    ]
  }

  if (status === "confirmed") {
    return [
      {
        nextStatus: "arranged",
        label: "Mark arranged",
        helper: "Pickup or delivery details have been coordinated.",
        variant: "primary",
      },
      {
        nextStatus: "completed",
        label: "Mark complete",
        helper: "Use when the buyer has received the item.",
      },
      {
        nextStatus: "cancelled",
        label: "Cancel order",
        helper: "Use only if this order cannot be fulfilled.",
        variant: "danger",
      },
    ]
  }

  if (status === "arranged") {
    return [
      {
        nextStatus: "completed",
        label: "Mark complete",
        helper: "Use when the buyer has received the item.",
        variant: "primary",
      },
      {
        nextStatus: "cancelled",
        label: "Cancel order",
        helper: "Use only if this order cannot be fulfilled.",
        variant: "danger",
      },
    ]
  }

  return []
}

export default function SellerOrderDetailPage() {
  const params = useParams()
  const supabase = useMemo(() => createClient(), [])

  const orderId = Array.isArray(params.orderId)
    ? params.orderId[0]
    : params.orderId

  const [order, setOrder] = useState<OrderRow | null>(null)
  const [buyer, setBuyer] = useState<ProfileRow | null>(null)
  const [conversationId, setConversationId] = useState("")
  const [orderEvents, setOrderEvents] = useState<OrderEventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingStage, setSavingStage] = useState("")
  const [stageError, setStageError] = useState("")
  const [stageMessage, setStageMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    async function loadSaleDetails() {
      if (!orderId) return

      setLoading(true)
      setError("")

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Please sign in to view this sale.")
        setLoading(false)
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
        setError("Sale not found.")
        setLoading(false)
        return
      }

      const normalizedOrder = orderData as unknown as OrderRow

      if (normalizedOrder.seller_id !== user.id) {
        setError("You do not have access to this sale.")
        setLoading(false)
        return
      }

      const [{ data: buyerProfile }, { data: conversationData }, { data: eventData }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, first_name, last_name, full_name")
            .eq("id", normalizedOrder.buyer_id)
            .single(),
          supabase
            .from("conversations")
            .select("id, order_id")
            .eq("order_id", normalizedOrder.id)
            .maybeSingle(),
          supabase
            .from("order_events")
            .select("id, order_id, event_type, note, created_at")
            .eq("order_id", normalizedOrder.id)
            .order("created_at", { ascending: true }),
        ])

      if (!mounted) return

      setOrder(normalizedOrder)
      setBuyer((buyerProfile || null) as ProfileRow | null)
      setConversationId((conversationData as ConversationRow | null)?.id || "")
      setOrderEvents((eventData || []) as OrderEventRow[])
      setLoading(false)
    }

    loadSaleDetails()

    return () => {
      mounted = false
    }
  }, [orderId, supabase])

  async function advanceStage(nextStatus: StageAction["nextStatus"]) {
    if (!order) return

    setSavingStage(nextStatus)
    setStageError("")
    setStageMessage("")

    const { data, error: rpcError } = await supabase.rpc(
      "advance_seller_order_stage",
      {
        p_order_id: order.id,
        p_next_status: nextStatus,
      }
    )

    setSavingStage("")

    if (rpcError) {
      setStageError(rpcError.message)
      return
    }

    const result = Array.isArray(data) ? data[0] : data

    setOrder({
      ...order,
      status: result?.status || nextStatus,
    })

    if (result?.event_id) {
      setOrderEvents((current) => [
        ...current,
        {
          id: result.event_id,
          order_id: order.id,
          event_type: result.event_type,
          note: result.event_note || "",
          created_at: result.event_created_at || new Date().toISOString(),
        },
      ])
    }

    setStageMessage("Order updated.")
  }

  if (loading) {
    return (
      <main className={styles.sellerOrdersPage}>
        <section className={styles.stateCard}>
          <h2>Loading sale</h2>
          <p>Getting the order details.</p>
        </section>
      </main>
    )
  }

  if (error || !order) {
    return (
      <main className={styles.sellerOrdersPage}>
        <section className={styles.stateCard}>
          <h2>Sale unavailable</h2>
          <p>{error || "This sale could not be loaded."}</p>
          <Link href="/seller/orders">Back to sales</Link>
        </section>
      </main>
    )
  }

  const listing = getListing(order)
  const imageUrl = getPrimaryImage(order)
  const buyerName = getProfileName(buyer)
  const messageHref = conversationId
    ? `/messages?conversationId=${conversationId}`
    : "/messages"
  const timelineEvents = buildTimelineEvents(order, orderEvents)
  const stageActions = getSellerStageActions(order.status)

  return (
    <main className={styles.sellerOrdersPage}>
      <header className={styles.sellerOrdersHeader}>
        <Link href="/seller/orders" className={styles.backLink}>
          Back
        </Link>

        <strong>Decor Encore</strong>

        <Link href={messageHref} className={styles.headerAction}>
          Message
        </Link>
      </header>

      <section className={styles.sellerOrdersShell}>
        <div className={styles.sellerOrdersIntro}>
          <p>Sale details</p>
          <h1>{buildConfirmationNumber(order.id)}</h1>
          <span>
            Use this page to review the sale and coordinate fulfillment with the
            buyer.
          </span>
        </div>

        <article className={styles.orderCard}>
          <div className={styles.orderImage}>
            {imageUrl ? (
              <img src={imageUrl} alt={listing?.title || "Sold item"} />
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
                <span>Buyer</span>
                <strong>{buyerName}</strong>
              </div>

              <div>
                <span>Sold on</span>
                <strong>{formatDate(order.created_at)}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{formatStatus(order.status)}</strong>
              </div>
            </div>

            <div className={styles.orderActions}>
              <Link href="/seller/orders">All sales</Link>

              <Link href={messageHref} className={styles.orderActionPrimary}>
                Message buyer
              </Link>

              <Link href={`/support/order?orderId=${order.id}`}>Need help</Link>
            </div>
          </div>
        </article>

        <section className={styles.stageCard}>
          <div className={styles.stageHeader}>
            <div>
              <p>Seller actions</p>
              <h2>{formatStatus(order.status)}</h2>
            </div>
            <span>{stageActions.length > 0 ? "Open" : "Final"}</span>
          </div>

          {stageActions.length > 0 ? (
            <div className={styles.stageActionList}>
              {stageActions.map((action) => (
                <button
                  key={action.nextStatus}
                  type="button"
                  className={
                    action.variant === "primary"
                      ? styles.stagePrimary
                      : action.variant === "danger"
                      ? styles.stageDanger
                      : ""
                  }
                  disabled={Boolean(savingStage)}
                  onClick={() => advanceStage(action.nextStatus)}
                >
                  <strong>
                    {savingStage === action.nextStatus
                      ? "Updating..."
                      : action.label}
                  </strong>
                  <span>{action.helper}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className={styles.stageEmpty}>
              This order does not have any seller actions available.
            </p>
          )}

          {stageError ? <p className={styles.stageError}>{stageError}</p> : null}
          {stageMessage ? (
            <p className={styles.stageMessage}>{stageMessage}</p>
          ) : null}
        </section>

          {order.status === "completed" ? (
          <section className={styles.stageCard}>
            <div className={styles.stageHeader}>
              <div>
                <p>Review</p>
                <h2>Review buyer</h2>
              </div>
              <span>Ready</span>
            </div>

            <div className={styles.stageActionList}>
              <Link href={`/reviews/order?orderId=${order.id}`}>
                <strong>Review buyer</strong>
                <span>Share feedback from this completed order.</span>
              </Link>
            </div>
          </section>
        ) : null}

        <section className={styles.timelineCard}>
          <div className={styles.timelineHeader}>
            <span>Status timeline</span>
            <strong>{timelineEvents.length}</strong>
          </div>

          <div className={styles.timelineList}>
            {timelineEvents.map((event, index) => (
              <div key={event.id} className={styles.timelineItem}>
                <div className={styles.timelineMarker}>
                  <span />
                  {index < timelineEvents.length - 1 ? <i /> : null}
                </div>

                <div className={styles.timelineContent}>
                  <div>
                    <strong>{event.label}</strong>
                    <span>
                      {formatDate(event.created_at)} · {formatTime(event.created_at)}
                    </span>
                  </div>

                  {event.note ? <p>{event.note}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.stateCard}>
          <h2>Fulfillment note</h2>
          <p>
            Coordinate pickup, delivery, and any order questions inside Decor
            Encore messages. Avoid sharing outside contact or payment details.
          </p>
        </section>
      </section>
    </main>
  )
}