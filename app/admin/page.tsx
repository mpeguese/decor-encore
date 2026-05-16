// app/admin/page.tsx
import Link from "next/link"
import { requireAdmin } from "@/app/lib/admin/requireAdmin"
import { createAdminSupabaseClient } from "@/app/lib/admin/supabaseAdmin"
import styles from "./admin.module.css"

type ListingReportRow = {
  id: string
  listing_id: string
  reported_by: string | null
  reason: string
  status: string
  created_at: string
}

type SupportRequestRow = {
  id: string
  order_id: string | null
  requester_id: string | null
  issue_type: string
  status: string
  message: string
  created_at: string
}

type OrderRow = {
  id: string
  listing_id: string | null
  buyer_id: string
  seller_id: string
  status: string
  refund_status: string | null
  refund_amount: number | null
  subtotal: number | null
  shipping_amount: number | null
  platform_fee: number | null
  total: number | null
  stripe_payment_intent_id: string | null
  created_at: string
}

type ListingRow = {
  id: string
  seller_id: string
  title: string
  status: string
  created_at: string
  updated_at: string | null
}

type ListingSummaryRow = {
  id: string
  title: string
}

const revenueEligibleStatuses = [
  "paid",
  "confirmed",
  "accepted",
  "seller_confirmed",
  "ready_for_pickup",
  "picked_up",
  "shipped",
  "completed",
]

const excludedRevenueStatuses = [
  "pending",
  "cancelled",
  "canceled",
  "failed",
  "expired",
  "refunded",
]

function formatDate(value: string | null | undefined) {
  if (!value) return "Not available"

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "Unknown"

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatMoney(value: number | null | undefined) {
  return `$${Number(value || 0).toFixed(2)}`
}

function buildConfirmationNumber(orderId: string) {
  const clean = orderId.replace(/-/g, "").toUpperCase()
  return `DE-${clean.slice(0, 4)}-${clean.slice(-6)}`
}

function sumMoney<T>(rows: T[], getValue: (row: T) => number | null | undefined) {
  return rows.reduce((sum, row) => sum + Number(getValue(row) || 0), 0)
}

function isRevenueEligibleOrder(order: OrderRow) {
  if (revenueEligibleStatuses.includes(order.status)) {
    return true
  }

  if (excludedRevenueStatuses.includes(order.status)) {
    return false
  }

  return Boolean(order.stripe_payment_intent_id)
}

export default async function AdminDashboardPage() {
  const { admin } = await requireAdmin("/admin")

  if (!admin) {
    return (
      <main className={styles.adminPage}>
        <section className={styles.adminShell}>
          <header className={styles.adminHeader}>
            <strong className={styles.adminBrand}>Decor Encore</strong>
            <Link href="/admin/login">Admin login</Link>
          </header>

          <div className={styles.accessDenied}>
            <h2>Access denied</h2>
            <p>
              This account is signed in, but it does not have active Decor Encore
              admin access.
            </p>
          </div>
        </section>
      </main>
    )
  }

  const supabase = createAdminSupabaseClient()

  const [
    { data: reportData },
    { data: supportData },
    { data: orderData },
    { data: listingData },
    { data: revenueOrderData },
  ] = await Promise.all([
    supabase
      .from("listing_reports")
      .select("id, listing_id, reported_by, reason, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100),

    supabase
      .from("order_support_requests")
      .select("id, order_id, requester_id, issue_type, status, message, created_at")
      .order("created_at", { ascending: false })
      .limit(100),

    supabase
      .from("orders")
      .select(
        "id, listing_id, buyer_id, seller_id, status, refund_status, refund_amount, subtotal, shipping_amount, platform_fee, total, stripe_payment_intent_id, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(100),

    supabase
      .from("listings")
      .select("id, seller_id, title, status, created_at, updated_at")
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(100),

    supabase
      .from("orders")
      .select(
        "id, listing_id, buyer_id, seller_id, status, refund_status, refund_amount, subtotal, shipping_amount, platform_fee, total, stripe_payment_intent_id, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(1000),
  ])

  const reports = (reportData || []) as ListingReportRow[]
  const supportRequests = (supportData || []) as SupportRequestRow[]
  const orders = (orderData || []) as OrderRow[]
  const listings = (listingData || []) as ListingRow[]
  const revenueOrdersAll = (revenueOrderData || []) as OrderRow[]

  const openReports = reports.filter((report) =>
    ["open", "in_review"].includes(report.status)
  )

  const openSupportRequests = supportRequests.filter((request) =>
    ["open", "in_review"].includes(request.status)
  )

  const openSupportOrderIds = new Set(
    openSupportRequests
      .map((request) => request.order_id)
      .filter((value): value is string => Boolean(value))
  )

  const orderNeedsReviewStatuses = [
    "pending",
    "cancel_requested",
    "cancellation_requested",
    "refund_requested",
    "disputed",
    "support_open",
  ]

  const ordersNeedingReview = orders.filter((order) => {
    return (
      orderNeedsReviewStatuses.includes(order.status) ||
      Boolean(order.refund_status) ||
      openSupportOrderIds.has(order.id)
    )
  })

  const pausedListings = listings.filter((listing) =>
    ["paused", "under_review", "removed"].includes(listing.status)
  )

  const publishedListings = listings.filter(
    (listing) => listing.status === "published"
  )

  const revenueOrders = revenueOrdersAll.filter(isRevenueEligibleOrder)

  const pendingRevenueOrders = revenueOrdersAll.filter(
    (order) => order.status === "pending"
  )

  const grossSales = sumMoney(revenueOrders, (order) => order.total)
  const itemSales = sumMoney(revenueOrders, (order) => order.subtotal)
  const platformFees = sumMoney(revenueOrders, (order) => order.platform_fee)
  const shippingCollected = sumMoney(
    revenueOrders,
    (order) => order.shipping_amount
  )
  const refundedAmount = sumMoney(revenueOrders, (order) => order.refund_amount)

  const pendingOrderValue = sumMoney(pendingRevenueOrders, (order) => order.total)

  const recentReportedListingIds = Array.from(
    new Set(openReports.map((report) => report.listing_id))
  ).slice(0, 6)

  const { data: reportedListingData } =
    recentReportedListingIds.length > 0
      ? await supabase
          .from("listings")
          .select("id, title")
          .in("id", recentReportedListingIds)
      : { data: [] }

  const reportedListings = (reportedListingData || []) as ListingSummaryRow[]
  const reportedListingsById = new Map(
    reportedListings.map((listing) => [listing.id, listing])
  )

  const latestReports = openReports.slice(0, 4)
  const latestSupport = openSupportRequests.slice(0, 4)
  const latestOrders = ordersNeedingReview.slice(0, 4)

  return (
    <main className={styles.adminPage}>
      <section className={styles.adminShell}>
        <header className={styles.adminHeader}>
          <Link href="/" aria-label="Public site">
            Public site
          </Link>

          <strong className={styles.adminBrand}>Decor Encore Admin</strong>

          <Link href="/admin/login">Switch user</Link>
        </header>

        <section className={styles.adminHero}>
          <p>Internal dashboard</p>
          <h1>Action center</h1>
          <span>
            Review reports, support requests, order issues, revenue, and
            marketplace moderation work that may need admin attention.
          </span>
        </section>

        <section className={styles.adminActionGrid}>
          <Link
            href="/admin/listings?filter=reports"
            className={`${styles.adminActionCard} ${
              openReports.length > 0 ? styles.adminActionCardUrgent : ""
            }`}
          >
            <span>Reports needing review</span>
            <strong>{openReports.length}</strong>
            <p>Open or in-review listing reports from buyers and visitors.</p>
          </Link>

          <Link
            href="/admin/support?status=open"
            className={`${styles.adminActionCard} ${
              openSupportRequests.length > 0 ? styles.adminActionCardUrgent : ""
            }`}
          >
            <span>Support queue</span>
            <strong>{openSupportRequests.length}</strong>
            <p>Open support requests tied to orders, buyers, or sellers.</p>
          </Link>

          <Link
            href="/admin/orders?filter=needs_review"
            className={`${styles.adminActionCard} ${
              ordersNeedingReview.length > 0 ? styles.adminActionCardWarn : ""
            }`}
          >
            <span>Orders needing review</span>
            <strong>{ordersNeedingReview.length}</strong>
            <p>Pending, disputed, refund-related, or support-linked orders.</p>
          </Link>

          <Link
            href="/admin/listings?status=paused"
            className={styles.adminActionCard}
          >
            <span>Paused / moderated listings</span>
            <strong>{pausedListings.length}</strong>
            <p>Paused, under-review, or removed listings.</p>
          </Link>

          <Link
            href="/admin/listings?status=published"
            className={styles.adminActionCard}
          >
            <span>Published listings</span>
            <strong>{publishedListings.length}</strong>
            <p>Recently loaded active marketplace listings.</p>
          </Link>

          <Link href="/admin/orders" className={styles.adminActionCard}>
            <span>Recent orders</span>
            <strong>{orders.length}</strong>
            <p>Latest loaded order activity across Decor Encore.</p>
          </Link>
        </section>

        <section className={styles.adminPanel}>
          <div className={styles.adminPanelHeader}>
            <span>Marketplace revenue</span>
            <strong>{formatMoney(grossSales)}</strong>
          </div>

          <p>
            First-pass revenue view based on eligible paid/completed order
            statuses and orders with payment intent data. Pending checkout value
            is shown separately so it does not inflate recognized sales.
          </p>

          <div className={styles.adminRevenueGrid}>
            <article className={styles.adminRevenueCard}>
              <span>Gross sales</span>
              <strong>{formatMoney(grossSales)}</strong>
              <p>Eligible order total value.</p>
            </article>

            <article className={styles.adminRevenueCard}>
              <span>Platform fees</span>
              <strong>{formatMoney(platformFees)}</strong>
              <p>Decor Encore fee revenue before refund adjustments.</p>
            </article>

            <article className={styles.adminRevenueCard}>
              <span>Item sales</span>
              <strong>{formatMoney(itemSales)}</strong>
              <p>Subtotal value of sold decor.</p>
            </article>

            <article className={styles.adminRevenueCard}>
              <span>Shipping collected</span>
              <strong>{formatMoney(shippingCollected)}</strong>
              <p>Shipping amounts collected through checkout.</p>
            </article>

            <article className={styles.adminRevenueCard}>
              <span>Refunded amount</span>
              <strong>{formatMoney(refundedAmount)}</strong>
              <p>Total refund amount recorded on eligible orders.</p>
            </article>

            <article className={styles.adminRevenueCard}>
              <span>Paid / eligible orders</span>
              <strong>{revenueOrders.length}</strong>
              <p>{pendingRevenueOrders.length} pending orders not counted.</p>
            </article>

            <article className={styles.adminRevenueCard}>
              <span>Pending checkout value</span>
              <strong>{formatMoney(pendingOrderValue)}</strong>
              <p>Pending orders excluded from recognized sales.</p>
            </article>
          </div>
        </section>

        <section className={styles.adminDashboardGrid}>
          <article className={styles.adminPanel}>
            <div className={styles.adminPanelHeader}>
              <span>Needs attention</span>
              <strong>Reports</strong>
            </div>

            {latestReports.length === 0 ? (
              <p>No open listing reports right now.</p>
            ) : (
              <div className={styles.adminMiniList}>
                {latestReports.map((report) => {
                  const listing = reportedListingsById.get(report.listing_id)

                  return (
                    <article key={report.id}>
                      <span>
                        {formatLabel(report.status)} · {formatDate(report.created_at)}
                      </span>
                      <strong>{listing?.title || "Reported listing"}</strong>
                      <p>{report.reason}</p>

                      <div className={styles.adminSupportActions}>
                        <Link href={`/admin/listings/${report.listing_id}`}>
                          Review listing
                        </Link>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </article>

          <article className={styles.adminPanel}>
            <div className={styles.adminPanelHeader}>
              <span>Needs attention</span>
              <strong>Support</strong>
            </div>

            {latestSupport.length === 0 ? (
              <p>No open support requests right now.</p>
            ) : (
              <div className={styles.adminMiniList}>
                {latestSupport.map((request) => (
                  <article key={request.id}>
                    <span>
                      {formatLabel(request.status)} ·{" "}
                      {formatDate(request.created_at)}
                    </span>
                    <strong>{formatLabel(request.issue_type)}</strong>
                    <p>
                      {request.message.length > 120
                        ? `${request.message.slice(0, 120)}...`
                        : request.message}
                    </p>

                    <div className={styles.adminSupportActions}>
                      {request.order_id ? (
                        <Link href={`/admin/orders/${request.order_id}`}>
                          Review order
                        </Link>
                      ) : (
                        <Link href="/admin/support">Open support</Link>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className={styles.adminPanel}>
          <div className={styles.adminPanelHeader}>
            <span>Operational review</span>
            <strong>Orders</strong>
          </div>

          {latestOrders.length === 0 ? (
            <p>No orders currently match the needs-review rules.</p>
          ) : (
            <div className={styles.adminMiniList}>
              {latestOrders.map((order) => (
                <article key={order.id}>
                  <span>
                    {formatLabel(order.status)} · {formatDate(order.created_at)}
                  </span>
                  <strong>{buildConfirmationNumber(order.id)}</strong>
                  <p>
                    {formatMoney(order.total)} ·{" "}
                    {order.refund_status
                      ? `Refund: ${formatLabel(order.refund_status)}`
                      : "Review order activity"}
                  </p>

                  <div className={styles.adminSupportActions}>
                    <Link href={`/admin/orders/${order.id}`}>Review order</Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}