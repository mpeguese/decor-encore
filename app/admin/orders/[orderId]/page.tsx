// app/admin/orders/[orderId]/page.tsx
import Link from "next/link"
import { notFound } from "next/navigation"
import { requireAdmin } from "@/app/lib/admin/requireAdmin"
import { createAdminSupabaseClient } from "@/app/lib/admin/supabaseAdmin"
import styles from "../../admin.module.css"
import AdminRefundButton from "./AdminRefundButton"

type PageProps = {
  params: Promise<{
    orderId: string
  }>
}

type OrderRow = {
  id: string
  listing_id: string | null
  buyer_id: string
  seller_id: string
  status: string
  subtotal: number | null
  shipping_amount: number | null
  platform_fee: number | null
  total: number | null
  fulfillment_method: string | null
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
  stripe_payment_intent_id: string | null
  stripe_refund_id: string | null
  refund_status: string | null
  refund_amount: number | null
  created_at: string
  updated_at: string | null
}

type ListingRow = {
  id: string
  title: string
  status: string
}

type ProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  email: string | null
}

type OrderEventRow = {
  id: string
  order_id: string
  event_type: string
  note: string | null
  created_at: string
}

type SupportRequestRow = {
  id: string
  order_id: string | null
  requester_id: string | null
  issue_type: string | null
  status: string
  message: string | null
  created_at: string
}

type ConversationRow = {
  id: string
  listing_id: string | null
  buyer_id: string
  seller_id: string
  order_id: string | null
  created_at: string
  updated_at: string | null
}

type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
}

function formatMoney(value: number | null | undefined) {
  return `$${Number(value || 0).toFixed(2)}`
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available"

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "Unknown"

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getProfileName(profile: ProfileRow | null | undefined) {
  if (!profile) return "Unknown"

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ")

  return name || profile.full_name || profile.email || "Unknown"
}

function getMessageSenderLabel(
  senderId: string,
  buyer: ProfileRow | null,
  seller: ProfileRow | null,
  order: OrderRow
) {
  if (senderId === order.buyer_id) {
    return `Buyer · ${getProfileName(buyer)}`
  }

  if (senderId === order.seller_id) {
    return `Seller · ${getProfileName(seller)}`
  }

  return "Unknown sender"
}

function buildConfirmationNumber(orderId: string) {
  const clean = orderId.replace(/-/g, "").toUpperCase()
  return `DE-${clean.slice(0, 4)}-${clean.slice(-6)}`
}

function buildShipToLines(order: OrderRow) {
  return [
    order.ship_to_name,
    order.ship_to_line1,
    order.ship_to_line2,
    [order.ship_to_city, order.ship_to_state, order.ship_to_postal_code]
      .filter(Boolean)
      .join(", "),
    order.ship_to_country,
  ].filter(Boolean)
}

function formatTimelineLabel(eventType: string) {
  const labels: Record<string, string> = {
    order_created: "Order placed",
    payment_received: "Payment received",
    mock_payment_completed: "Payment completed",
    seller_confirmed: "Seller confirmed",
    pickup_delivery_arranged: "Pickup arranged",
    seller_marked_shipped: "Shipped",
    buyer_confirmed_received: "Buyer confirmed received",
    order_completed: "Completed",
    order_cancelled: "Cancelled",
    cancellation_requested: "Cancellation requested",
    refund_requested: "Refund requested",
    refund_processed: "Refund processed",
    support_requested: "Help requested",
  }

  return labels[eventType] || formatLabel(eventType)
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { orderId } = await params
  const { admin } = await requireAdmin(`/admin/orders/${orderId}`)

  if (!admin) {
    return (
      <main className={styles.adminPage}>
        <section className={styles.adminShell}>
          <div className={styles.accessDenied}>
            <h2>Access denied</h2>
            <p>This account does not have active Decor Encore admin access.</p>
          </div>
        </section>
      </main>
    )
  }

  const supabase = createAdminSupabaseClient()

  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .select(
      "id, listing_id, buyer_id, seller_id, status, subtotal, shipping_amount, platform_fee, total, fulfillment_method, ship_to_name, ship_to_line1, ship_to_line2, ship_to_city, ship_to_state, ship_to_postal_code, ship_to_country, shipping_rate_provider, shipping_rate_id, shipping_carrier, shipping_service, shipping_estimated_days, stripe_payment_intent_id, stripe_refund_id, refund_status, refund_amount, created_at, updated_at"
    )
    .eq("id", orderId)
    .single()

  if (orderError || !orderData) {
    notFound()
  }

  const order = orderData as OrderRow

  const [
    { data: listingData },
    { data: buyerData },
    { data: sellerData },
    { data: eventData },
    { data: supportData },
    { data: conversationData },
  ] = await Promise.all([
    order.listing_id
      ? supabase
          .from("listings")
          .select("id, title, status")
          .eq("id", order.listing_id)
          .single()
      : Promise.resolve({ data: null }),

    supabase
      .from("profiles")
      .select("id, first_name, last_name, full_name, email")
      .eq("id", order.buyer_id)
      .maybeSingle(),

    supabase
      .from("profiles")
      .select("id, first_name, last_name, full_name, email")
      .eq("id", order.seller_id)
      .maybeSingle(),

    supabase
      .from("order_events")
      .select("id, order_id, event_type, note, created_at")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true }),

    supabase
      .from("order_support_requests")
      .select("id, order_id, requester_id, issue_type, status, message, created_at")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false }),

    order.listing_id
      ? supabase
          .from("conversations")
          .select("id, listing_id, buyer_id, seller_id, order_id, created_at, updated_at")
          .or(
            `order_id.eq.${order.id},and(listing_id.eq.${order.listing_id},buyer_id.eq.${order.buyer_id},seller_id.eq.${order.seller_id})`
          )
          .order("created_at", { ascending: false })
          .limit(1)
      : supabase
          .from("conversations")
          .select("id, listing_id, buyer_id, seller_id, order_id, created_at, updated_at")
          .eq("order_id", order.id)
          .order("created_at", { ascending: false })
          .limit(1),
  ])

  const listing = (listingData || null) as ListingRow | null
  const buyer = (buyerData || null) as ProfileRow | null
  const seller = (sellerData || null) as ProfileRow | null
  const events = (eventData || []) as OrderEventRow[]
  const supportRequests = (supportData || []) as SupportRequestRow[]
  const conversations = (conversationData || []) as ConversationRow[]
  const conversation = conversations[0] || null
  const shipToLines = buildShipToLines(order)

  const selectedService = [order.shipping_carrier, order.shipping_service]
    .filter(Boolean)
    .join(" ")

  const { data: messageData } = conversation
  ? await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, body, created_at")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true })
  : { data: [] }

const messages = (messageData || []) as MessageRow[]

  return (
    <main className={styles.adminPage}>
      <section className={styles.adminShell}>
        <header className={styles.adminHeader}>
          <Link href="/admin/orders">Orders</Link>
          <strong className={styles.adminBrand}>Order Detail</strong>
          <Link href="/admin/support">Support</Link>
        </header>

        <section className={styles.adminHero}>
          <p>{buildConfirmationNumber(order.id)}</p>
          <h1>{listing?.title || "Decor order"}</h1>
          <span>
            Internal review for payment, fulfillment, shipping, cancellation,
            support, and timeline history.
          </span>
        </section>

        <section className={styles.adminDetailGrid}>
          <article className={styles.adminDetailCard}>
            <span>Order status</span>
            <strong>{formatLabel(order.status)}</strong>
            <p>Created {formatDateTime(order.created_at)}</p>
          </article>

          <article className={styles.adminDetailCard}>
            <span>Total</span>
            <strong>{formatMoney(order.total)}</strong>
            <p>
              Subtotal {formatMoney(order.subtotal)} · Shipping{" "}
              {formatMoney(order.shipping_amount)} · Fee{" "}
              {formatMoney(order.platform_fee)}
            </p>
          </article>

          <article className={styles.adminDetailCard}>
            <span>Fulfillment</span>
            <strong>{formatLabel(order.fulfillment_method)}</strong>
            <p>{selectedService || "No shipping service selected."}</p>
          </article>
        </section>

        <section className={styles.adminTwoColumn}>
          <article className={styles.adminPanel}>
            <div className={styles.adminPanelHeader}>
              <span>Buyer</span>
              <strong>{getProfileName(buyer)}</strong>
            </div>
            <p>{buyer?.email || "No buyer email found."}</p>
          </article>

          <article className={styles.adminPanel}>
            <div className={styles.adminPanelHeader}>
              <span>Seller</span>
              <strong>{getProfileName(seller)}</strong>
            </div>
            <p>{seller?.email || "No seller email found."}</p>
          </article>
        </section>

        <section className={styles.adminTwoColumn}>
          <article className={styles.adminPanel}>
            <div className={styles.adminPanelHeader}>
              <span>Payment</span>
              <strong>Stripe</strong>
            </div>

            <div className={styles.adminKeyValueList}>
              <div>
                <span>PaymentIntent</span>
                <strong>{order.stripe_payment_intent_id || "None"}</strong>
              </div>

              <div>
                <span>Refund ID</span>
                <strong>{order.stripe_refund_id || "None"}</strong>
              </div>

              <div>
                <span>Refund status</span>
                <strong>{formatLabel(order.refund_status)}</strong>
              </div>

              <div>
                <span>Refund amount</span>
                <strong>{formatMoney(order.refund_amount)}</strong>
              </div>
            </div>

            <AdminRefundButton
              orderId={order.id}
              total={Number(order.total || 0)}
              refundStatus={order.refund_status}
              stripeRefundId={order.stripe_refund_id}
              disabled={
                !order.stripe_payment_intent_id ||
                order.status === "refunded" ||
                order.status === "cancelled" ||
                order.refund_status === "succeeded"
                //Boolean(order.stripe_refund_id)
              }
            />
          </article>

          <article className={styles.adminPanel}>
            <div className={styles.adminPanelHeader}>
              <span>Shipping</span>
              <strong>{selectedService || "Not selected"}</strong>
            </div>

            {shipToLines.length > 0 ? (
              <address className={styles.adminAddress}>
                {shipToLines.map((line) => (
                  <strong key={line}>{line}</strong>
                ))}
              </address>
            ) : (
              <p>No shipping address stored for this order.</p>
            )}
          </article>
        </section>

        <section className={styles.adminPanel}>
          <div className={styles.adminPanelHeader}>
            <span>Support requests</span>
            <strong>{supportRequests.length}</strong>
          </div>

          {supportRequests.length === 0 ? (
            <p>No support requests found for this order.</p>
          ) : (
            <div className={styles.adminMiniList}>
              {supportRequests.map((request) => (
                <article key={request.id}>
                  <span>
                    {formatLabel(request.issue_type)} ·{" "}
                    {formatLabel(request.status)}
                  </span>
                  <strong>{formatDateTime(request.created_at)}</strong>
                  {request.message ? <p>{request.message}</p> : null}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={styles.adminPanel}>
          <details className={styles.adminConversationDetails}>
            <summary className={styles.adminConversationSummary}>
              <div>
                <span>Order conversation</span>
                <strong>{messages.length} Messages</strong>
              </div>

              <em>Expand</em>
            </summary>

            <div className={styles.adminConversationBody}>
              {!conversation ? (
                <p>No buyer-seller conversation found for this order.</p>
              ) : messages.length === 0 ? (
                <p>This conversation exists, but no messages have been sent yet.</p>
              ) : (
                <div className={styles.adminMiniList}>
                  {messages.map((message) => (
                    <article key={message.id}>
                      <span>
                        {getMessageSenderLabel(message.sender_id, buyer, seller, order)}
                      </span>
                      <strong>{formatDateTime(message.created_at)}</strong>
                      <p>{message.body}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </details>
        </section>

        <section className={styles.adminPanel}>
          <div className={styles.adminPanelHeader}>
            <span>Timeline</span>
            <strong>{events.length}</strong>
          </div>

          {events.length === 0 ? (
            <p>No timeline events found.</p>
          ) : (
            <div className={styles.adminTimeline}>
              {events.map((event) => (
                <article key={event.id}>
                  <div>
                    <strong>{formatTimelineLabel(event.event_type)}</strong>
                    <span>{formatDateTime(event.created_at)}</span>
                  </div>
                  {event.note ? <p>{event.note}</p> : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}