// app/orders/[orderId]/confirmation/page.tsx
"use client"

import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/app/lib/supabase/client"
import styles from "./confirmation.module.css"

type OrderRow = {
  id: string
  listing_id: string
  buyer_id: string
  status: string
  subtotal: number
  shipping_amount: number
  platform_fee: number
  total: number
  fulfillment_method: string | null
  shipping_carrier: string | null
  shipping_service: string | null
  shipping_estimated_days: number | null
  created_at: string
}

type ListingRow = {
  id: string
  title: string
  pickup_city: string | null
  pickup_state: string | null
}

type ListingImageRow = {
  image_url: string
  is_primary: boolean
  sort_order: number
}

type OrderEventRow = {
  id: string
  order_id: string
  event_type: string
  note: string | null
  created_at: string
}

type CancellationRequestRow = {
  id: string
  status: string
}

function buildConfirmationNumber(orderId: string) {
  const clean = orderId.replace(/-/g, "").toUpperCase()
  return `DE-${clean.slice(0, 4)}-${clean.slice(-6)}`
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function formatOrderTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

function getPrimaryImage(images: ListingImageRow[]) {
  return [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.sort_order - b.sort_order
  })[0]?.image_url
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
    seller_marked_shipped: "Shipped",
    buyer_confirmed_received: "Buyer confirmed received",
    buyer_reviewed_seller: "Buyer reviewed seller",
    seller_reviewed_buyer: "Seller reviewed buyer",
    cancellation_requested: "Cancellation requested",
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
      note: "Your order was created.",
      created_at: order.created_at,
    },
  ]
}

function canConfirmReceived(status: string) {
  return status === "confirmed" || status === "arranged"
}

function canRequestCancellation(status: string) {
  return !["completed", "cancelled", "refunded"].includes(status)
}

export default function OrderConfirmationPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])

  const orderId = Array.isArray(params.orderId)
    ? params.orderId[0]
    : params.orderId

  const conversationId = searchParams.get("conversationId")

  const [order, setOrder] = useState<OrderRow | null>(null)
  const [listing, setListing] = useState<ListingRow | null>(null)
  const [images, setImages] = useState<ListingImageRow[]>([])
  const [orderEvents, setOrderEvents] = useState<OrderEventRow[]>([])
  const [buyerEmail, setBuyerEmail] = useState("")
  const [hasCancellationRequest, setHasCancellationRequest] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingReceived, setSavingReceived] = useState(false)
  const [savingCancellation, setSavingCancellation] = useState(false)
  const [actionError, setActionError] = useState("")
  const [actionMessage, setActionMessage] = useState("")
  const [cancelError, setCancelError] = useState("")
  const [cancelMessage, setCancelMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    async function loadConfirmation() {
      if (!orderId) return

      setLoading(true)
      setError("")

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return

      if (!user) {
        setError("Please sign in to view this order.")
        setLoading(false)
        return
      }

      setBuyerEmail(user.email || "")

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("id, listing_id, buyer_id, status, subtotal, shipping_amount, platform_fee, total, fulfillment_method, shipping_carrier, shipping_service, shipping_estimated_days, created_at")
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
        setError("You do not have access to this order.")
        setLoading(false)
        return
      }

      const [
        { data: listingData },
        { data: imageData },
        { data: eventData },
        { data: cancellationData },
      ] = await Promise.all([
        supabase
          .from("listings")
          .select("id, title, pickup_city, pickup_state")
          .eq("id", normalizedOrder.listing_id)
          .single(),
        supabase
          .from("listing_images")
          .select("image_url, is_primary, sort_order")
          .eq("listing_id", normalizedOrder.listing_id)
          .order("sort_order", { ascending: true }),
        supabase
          .from("order_events")
          .select("id, order_id, event_type, note, created_at")
          .eq("order_id", normalizedOrder.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("order_support_requests")
          .select("id, status")
          .eq("order_id", normalizedOrder.id)
          .eq("requester_id", user.id)
          .eq("issue_type", "cancel_order")
          .in("status", ["open", "in_review"])
          .maybeSingle(),
      ])

      if (!mounted) return

      setOrder(normalizedOrder)
      setListing((listingData || null) as ListingRow | null)
      setImages((imageData || []) as ListingImageRow[])
      setOrderEvents((eventData || []) as OrderEventRow[])
      setHasCancellationRequest(Boolean((cancellationData as CancellationRequestRow | null)?.id))
      setLoading(false)
    }

    loadConfirmation()

    return () => {
      mounted = false
    }
  }, [orderId, supabase])

  async function handleConfirmReceived() {
    if (!order) return

    setSavingReceived(true)
    setActionError("")
    setActionMessage("")

    const { data, error: rpcError } = await supabase.rpc(
      "confirm_buyer_order_received",
      {
        p_order_id: order.id,
      }
    )

    setSavingReceived(false)

    if (rpcError) {
      setActionError(rpcError.message)
      return
    }

    const result = Array.isArray(data) ? data[0] : data

    setOrder({
      ...order,
      status: result?.status || "completed",
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

    setActionMessage("Order marked received.")
  }

  async function handleCancellationRequest() {
    if (!order) return

    setSavingCancellation(true)
    setCancelError("")
    setCancelMessage("")

    const { data, error: rpcError } = await supabase.rpc(
      "request_buyer_order_cancellation",
      {
        p_order_id: order.id,
      }
    )

    setSavingCancellation(false)

    if (rpcError) {
      setCancelError(rpcError.message)
      return
    }

    const result = Array.isArray(data) ? data[0] : data

    setHasCancellationRequest(true)

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

    setCancelMessage("Cancellation request sent.")
  }

  if (loading) {
    return (
      <main className={styles.confirmationPage}>
        <section className={styles.receiptShell}>
          <h1>Loading confirmation</h1>
          <p>Getting your order details.</p>
        </section>
      </main>
    )
  }

  if (error || !order) {
    return (
      <main className={styles.confirmationPage}>
        <section className={styles.receiptShell}>
          <h1>Order unavailable</h1>
          <p>{error || "This order could not be loaded."}</p>
          <Link href="/marketplace" className={styles.singleAction}>
            Back to marketplace
          </Link>
        </section>
      </main>
    )
  }

  const confirmationNumber = buildConfirmationNumber(order.id)
  const subtotalPaid = Number(order.subtotal || 0).toFixed(2)
  const shippingPaid = Number(order.shipping_amount || 0).toFixed(2)
  const platformFeePaid = Number(order.platform_fee || 0).toFixed(2)
  const totalPaid = Number(order.total || 0).toFixed(2)
  const imageUrl = getPrimaryImage(images)
  const messageHref = conversationId
    ? `/messages?conversationId=${conversationId}`
    : "/messages"
  const timelineEvents = buildTimelineEvents(order, orderEvents)
  const showConfirmReceived = canConfirmReceived(order.status)
  const showCancellationRequest =
    canRequestCancellation(order.status) && !hasCancellationRequest

  const isShippingOrder = order.fulfillment_method === "shipping"
  const selectedShippingService = [order.shipping_carrier, order.shipping_service]
    .filter(Boolean)
    .join(" ")

  return (
    <main className={styles.confirmationPage}>
      <section className={styles.receiptShell}>
        <div className={styles.receiptHeader}>
          <div className={styles.checkMark}>✓</div>

          <p>{formatStatus(order.status)}</p>
          <h1>Order</h1>

          <span>
            A confirmation email has been sent to{" "}
            <strong>{buyerEmail || "your account email"}</strong>.
          </span>

          {imageUrl ? (
            <div className={styles.receiptImageWrap}>
              <img src={imageUrl} alt={listing?.title || "Purchased listing"} />
            </div>
          ) : null}
        </div>

        <div className={styles.receiptMeta}>
          <div>
            <span>Confirmation</span>
            <strong>{confirmationNumber}</strong>
          </div>

          <div>
            <span>Date</span>
            <strong>
              {formatOrderDate(order.created_at)} ·{" "}
              {formatOrderTime(order.created_at)}
            </strong>
          </div>
        </div>

        <div className={styles.receiptDivider} />

        <div className={styles.receiptList}>
          <div>
            <span>Item</span>
            <strong>{listing?.title || "Decor listing"}</strong>
          </div>
          <p>${subtotalPaid}</p>
        </div>

        <div className={styles.receiptLine}>
          <div>
            <span>Subtotal</span>
          </div>
          <p>${subtotalPaid}</p>
        </div>

        {Number(order.shipping_amount || 0) > 0 ? (
          <div className={styles.receiptLine}>
            <div>
              <span>Shipping</span>
              {isShippingOrder && selectedShippingService ? (
                <strong>{selectedShippingService}</strong>
              ) : null}
            </div>
            <p>${shippingPaid}</p>
          </div>
        ) : null}

        <div className={styles.receiptLine}>
          <div>
            <span>Platform fee</span>
          </div>
          <p>${platformFeePaid}</p>
        </div>

        <div className={styles.receiptDivider} />

        <div className={styles.receiptTotal}>
          <span>Total paid</span>
          <strong>${totalPaid}</strong>
        </div>

        <section className={styles.buyerActionCard}>
          <div className={styles.buyerActionHeader}>
            <div>
              <span>Order status</span>
              <strong>{formatStatus(order.status)}</strong>
            </div>
          </div>

          {showConfirmReceived ? (
            <div className={styles.buyerActionList}>
              <button
                type="button"
                className={styles.buyerPrimaryAction}
                disabled={savingReceived}
                onClick={handleConfirmReceived}
              >
                {savingReceived ? "Updating..." : "Confirm received"}
              </button>

              <Link href={`/support/order?orderId=${order.id}`}>
                Need help?
              </Link>
            </div>
          ) : (
            <p className={styles.buyerActionNote}>
              {order.status === "completed"
                ? "This order has been marked complete."
                : order.status === "cancelled"
                  ? "This order has been cancelled."
                  : isShippingOrder
                  ? "You can confirm receipt after the seller ships the order and it arrives."
                  : "You can confirm receipt after the seller confirms or arranges pickup."}
            </p>
          )}

          {actionError ? (
            <p className={styles.buyerActionError}>{actionError}</p>
          ) : null}
          {actionMessage ? (
            <p className={styles.buyerActionMessage}>{actionMessage}</p>
          ) : null}
        </section>

        {canRequestCancellation(order.status) ? (
          <section className={styles.cancelRequestCard}>
            <div className={styles.cancelRequestHeader}>
              <div>
                <span>Cancellation</span>
                <strong>
                  {hasCancellationRequest
                    ? "Request sent"
                    : "Need to cancel?"}
                </strong>
              </div>
            </div>

            <p>
              If the order cannot be completed, request cancellation here. If
              payment has already been made, Decor Encore support may need to
              review the order before any refund is processed.
            </p>

            {showCancellationRequest ? (
              <button
                type="button"
                disabled={savingCancellation}
                onClick={handleCancellationRequest}
              >
                {savingCancellation ? "Sending..." : "Request cancellation"}
              </button>
            ) : (
              <span className={styles.cancelRequestStatus}>
                Cancellation request is open.
              </span>
            )}

            {cancelError ? (
              <p className={styles.buyerActionError}>{cancelError}</p>
            ) : null}
            {cancelMessage ? (
              <p className={styles.buyerActionMessage}>{cancelMessage}</p>
            ) : null}
          </section>
        ) : null}

        {order.status === "completed" ? (
          <Link
            href={`/reviews/order?orderId=${order.id}`}
            className={styles.helpButton}
          >
            Review seller
          </Link>
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
                      {formatOrderDate(event.created_at)} ·{" "}
                      {formatOrderTime(event.created_at)}
                    </span>
                  </div>

                  {event.note ? <p>{event.note}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        <Link href={messageHref} className={styles.messageSellerButton}>
          Message seller
        </Link>

        <Link
          href={`/support/order?orderId=${order.id}`}
          className={styles.helpButton}
        >
          Need help with this order?
        </Link>

        <p className={styles.receiptNote}>
          Keep this confirmation number for your records. Coordinate pickup,
          delivery, and fulfillment inside Decor Encore messages.
        </p>
      </section>

      <nav className={styles.confirmationBottomBar}>
        <div className={styles.confirmationSegment}>
          <Link href="/marketplace" className={styles.confirmationOption}>
            Keep shopping
          </Link>

          <Link
            href="/orders"
            className={`${styles.confirmationOption} ${styles.confirmationPrimary}`}
          >
            Orders
          </Link>

          <Link href={messageHref} className={styles.confirmationOption}>
            Messages
          </Link>

          <span className={styles.confirmationSlider} />
        </div>
      </nav>
    </main>
  )
}