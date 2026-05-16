// app/admin/support/page.tsx
import Link from "next/link"
import { requireAdmin } from "@/app/lib/admin/requireAdmin"
import { createAdminSupabaseClient } from "@/app/lib/admin/supabaseAdmin"
import styles from "../admin.module.css"

type PageProps = {
  searchParams?: Promise<{
    status?: string
  }>
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

type OrderRow = {
  id: string
  listing_id: string | null
  buyer_id: string
  seller_id: string
  status: string
  fulfillment_method: string | null
  total: number | null
  created_at: string
}

type ListingRow = {
  id: string
  title: string
}

type ProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  email: string | null
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function formatMoney(value: number | null | undefined) {
  return `$${Number(value || 0).toFixed(2)}`
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "Unknown"

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getProfileName(profile: ProfileRow | undefined) {
  if (!profile) return "Unknown"

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ")

  return name || profile.full_name || profile.email || "Unknown"
}

function buildConfirmationNumber(orderId: string) {
  const clean = orderId.replace(/-/g, "").toUpperCase()
  return `DE-${clean.slice(0, 4)}-${clean.slice(-6)}`
}

export default async function AdminSupportPage({ searchParams }: PageProps) {
  const { admin } = await requireAdmin("/admin/support")

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
  const params = await searchParams
  const activeStatus = params?.status || ""

  let supportQuery = supabase
    .from("order_support_requests")
    .select("id, order_id, requester_id, issue_type, status, message, created_at")
    .order("created_at", { ascending: false })
    .limit(50)

  if (activeStatus === "open") {
    supportQuery = supportQuery.in("status", ["open", "in_review"])
  } else if (activeStatus) {
    supportQuery = supportQuery.eq("status", activeStatus)
  }

  const { data: supportData, error: supportError } = await supportQuery

  const supportRequests = (supportData || []) as SupportRequestRow[]

  const orderIds = Array.from(
    new Set(
      supportRequests
        .map((request) => request.order_id)
        .filter((value): value is string => Boolean(value))
    )
  )

  const { data: orderData } =
    orderIds.length > 0
      ? await supabase
          .from("orders")
          .select(
            "id, listing_id, buyer_id, seller_id, status, fulfillment_method, total, created_at"
          )
          .in("id", orderIds)
      : { data: [] }

  const orders = (orderData || []) as OrderRow[]
  const ordersById = new Map(orders.map((order) => [order.id, order]))

  const listingIds = Array.from(
    new Set(
      orders
        .map((order) => order.listing_id)
        .filter((value): value is string => Boolean(value))
    )
  )

  const profileIds = Array.from(
    new Set(
      [
        ...orders.map((order) => order.buyer_id),
        ...orders.map((order) => order.seller_id),
        ...supportRequests
          .map((request) => request.requester_id)
          .filter((value): value is string => Boolean(value)),
      ].filter(Boolean)
    )
  )

  const [{ data: listingData }, { data: profileData }] = await Promise.all([
    listingIds.length > 0
      ? supabase.from("listings").select("id, title").in("id", listingIds)
      : Promise.resolve({ data: [] }),
    profileIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, first_name, last_name, full_name, email")
          .in("id", profileIds)
      : Promise.resolve({ data: [] }),
  ])

  const listings = (listingData || []) as ListingRow[]
  const profiles = (profileData || []) as ProfileRow[]

  const listingsById = new Map(listings.map((listing) => [listing.id, listing]))
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]))

  const openCount = supportRequests.filter((request) =>
    ["open", "in_review"].includes(request.status)
  ).length

  return (
    <main className={styles.adminPage}>
      <section className={styles.adminShell}>
        <header className={styles.adminHeader}>
          <Link href="/admin">Dashboard</Link>
          <strong className={styles.adminBrand}>Support Queue</strong>
          <Link href="/admin/orders">Orders</Link>
        </header>

        <section className={styles.adminHero}>
          <p>Admin support</p>
          <h1>Support queue</h1>
          <span>
            Review cancellation requests, order help, buyer issues, and seller
            fulfillment problems.
          </span>
        </section>

        <section className={styles.adminFilterBar} aria-label="Support filters">
          <Link
            href="/admin/support"
            className={!activeStatus ? styles.adminFilterActive : ""}
          >
            All
          </Link>

          <Link
            href="/admin/support?status=open"
            className={activeStatus === "open" ? styles.adminFilterActive : ""}
          >
            Open / in review
          </Link>

          <Link
            href="/admin/support?status=in_review"
            className={
              activeStatus === "in_review" ? styles.adminFilterActive : ""
            }
          >
            In review
          </Link>

          <Link
            href="/admin/support?status=resolved"
            className={activeStatus === "resolved" ? styles.adminFilterActive : ""}
          >
            Resolved
          </Link>
        </section>

        <section className={styles.adminStatGrid}>
          <div className={styles.adminStatCard}>
            <span>Open / in review</span>
            <strong>{openCount}</strong>
          </div>

          <div className={styles.adminStatCard}>
            <span>Total loaded</span>
            <strong>{supportRequests.length}</strong>
          </div>

          <div className={styles.adminStatCard}>
            <span>Role</span>
            <strong>{admin.role}</strong>
          </div>
        </section>

        {supportError ? (
          <section className={styles.adminStateCard}>
            <h2>Support unavailable</h2>
            <p>{supportError.message}</p>
          </section>
        ) : null}

        {!supportError && supportRequests.length === 0 ? (
          <section className={styles.adminStateCard}>
            <h2>No support requests</h2>
            <p>New order support issues will appear here.</p>
          </section>
        ) : null}

        {!supportError && supportRequests.length > 0 ? (
          <section className={styles.adminList}>
            {supportRequests.map((request) => {
              const order = request.order_id
                ? ordersById.get(request.order_id)
                : undefined
              const listing = order?.listing_id
                ? listingsById.get(order.listing_id)
                : undefined
              const requester = request.requester_id
                ? profilesById.get(request.requester_id)
                : undefined
              const buyer = order ? profilesById.get(order.buyer_id) : undefined
              const seller = order ? profilesById.get(order.seller_id) : undefined

              return (
                <article key={request.id} className={styles.adminSupportCard}>
                  <div className={styles.adminSupportTop}>
                    <div>
                      <span>{formatLabel(request.issue_type)}</span>
                      <h2>{listing?.title || "Order support request"}</h2>
                    </div>

                    <strong>{formatLabel(request.status)}</strong>
                  </div>

                  <div className={styles.adminSupportMeta}>
                    <div>
                      <span>Created</span>
                      <strong>{formatDate(request.created_at)}</strong>
                    </div>

                    <div>
                      <span>Requester</span>
                      <strong>{getProfileName(requester)}</strong>
                    </div>

                    <div>
                      <span>Order</span>
                      <strong>
                        {order ? buildConfirmationNumber(order.id) : "No order"}
                      </strong>
                    </div>

                    <div>
                      <span>Total</span>
                      <strong>{formatMoney(order?.total)}</strong>
                    </div>
                  </div>

                  <div className={styles.adminSupportParties}>
                    <div>
                      <span>Buyer</span>
                      <strong>{getProfileName(buyer)}</strong>
                    </div>

                    <div>
                      <span>Seller</span>
                      <strong>{getProfileName(seller)}</strong>
                    </div>
                  </div>

                  {request.message ? (
                    <p className={styles.adminSupportMessage}>
                      {request.message}
                    </p>
                  ) : null}

                  <div className={styles.adminSupportActions}>
                    {order ? (
                      <Link href={`/admin/orders/${order.id}`}>Review order</Link>
                    ) : null}

                    <Link href="/admin/support">Keep in queue</Link>
                  </div>
                </article>
              )
            })}
          </section>
        ) : null}
      </section>
    </main>
  )
}