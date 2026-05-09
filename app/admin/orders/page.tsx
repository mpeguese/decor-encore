// app/admin/orders/page.tsx
import Link from "next/link"
import { requireAdmin } from "@/app/lib/admin/requireAdmin"
import { createAdminSupabaseClient } from "@/app/lib/admin/supabaseAdmin"
import styles from "../admin.module.css"

type OrderRow = {
  id: string
  listing_id: string | null
  buyer_id: string
  seller_id: string
  status: string
  fulfillment_method: string | null
  subtotal: number | null
  shipping_amount: number | null
  platform_fee: number | null
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

function formatMoney(value: number | null | undefined) {
  return `$${Number(value || 0).toFixed(2)}`
}

function formatDate(value: string) {
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

function getProfileName(profile: ProfileRow | undefined) {
  if (!profile) return "Unknown"

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ")

  return name || profile.full_name || profile.email || "Unknown"
}

function buildConfirmationNumber(orderId: string) {
  const clean = orderId.replace(/-/g, "").toUpperCase()
  return `DE-${clean.slice(0, 4)}-${clean.slice(-6)}`
}

export default async function AdminOrdersPage() {
  const { admin } = await requireAdmin("/admin/orders")

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

  const { data: orderData, error } = await supabase
    .from("orders")
    .select(
      "id, listing_id, buyer_id, seller_id, status, fulfillment_method, subtotal, shipping_amount, platform_fee, total, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(50)

  const orders = (orderData || []) as OrderRow[]

  const listingIds = Array.from(
    new Set(
      orders
        .map((order) => order.listing_id)
        .filter((value): value is string => Boolean(value))
    )
  )

  const profileIds = Array.from(
    new Set(
      orders
        .flatMap((order) => [order.buyer_id, order.seller_id])
        .filter(Boolean)
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

  return (
    <main className={styles.adminPage}>
      <section className={styles.adminShell}>
        <header className={styles.adminHeader}>
          <Link href="/admin">Dashboard</Link>
          <strong className={styles.adminBrand}>Order Review</strong>
          <Link href="/admin/support">Support</Link>
        </header>

        <section className={styles.adminHero}>
          <p>Admin orders</p>
          <h1>Recent orders</h1>
          <span>
            Review the latest orders, payments, shipping method, fulfillment
            state, and support context.
          </span>
        </section>

        {error ? (
          <section className={styles.adminStateCard}>
            <h2>Orders unavailable</h2>
            <p>{error.message}</p>
          </section>
        ) : null}

        {!error && orders.length === 0 ? (
          <section className={styles.adminStateCard}>
            <h2>No orders found</h2>
            <p>Orders will appear here after checkout activity.</p>
          </section>
        ) : null}

        {!error && orders.length > 0 ? (
          <section className={styles.adminList}>
            {orders.map((order) => {
              const listing = order.listing_id
                ? listingsById.get(order.listing_id)
                : undefined
              const buyer = profilesById.get(order.buyer_id)
              const seller = profilesById.get(order.seller_id)

              return (
                <article key={order.id} className={styles.adminSupportCard}>
                  <div className={styles.adminSupportTop}>
                    <div>
                      <span>{buildConfirmationNumber(order.id)}</span>
                      <h2>{listing?.title || "Decor order"}</h2>
                    </div>

                    <strong>{formatMoney(order.total)}</strong>
                  </div>

                  <div className={styles.adminSupportMeta}>
                    <div>
                      <span>Status</span>
                      <strong>{formatLabel(order.status)}</strong>
                    </div>

                    <div>
                      <span>Fulfillment</span>
                      <strong>{formatLabel(order.fulfillment_method)}</strong>
                    </div>

                    <div>
                      <span>Buyer</span>
                      <strong>{getProfileName(buyer)}</strong>
                    </div>

                    <div>
                      <span>Seller</span>
                      <strong>{getProfileName(seller)}</strong>
                    </div>

                    <div>
                      <span>Date</span>
                      <strong>{formatDate(order.created_at)}</strong>
                    </div>
                  </div>

                  <div className={styles.adminMoneyGrid}>
                    <div>
                      <span>Subtotal</span>
                      <strong>{formatMoney(order.subtotal)}</strong>
                    </div>

                    <div>
                      <span>Shipping</span>
                      <strong>{formatMoney(order.shipping_amount)}</strong>
                    </div>

                    <div>
                      <span>Platform fee</span>
                      <strong>{formatMoney(order.platform_fee)}</strong>
                    </div>
                  </div>

                  <div className={styles.adminSupportActions}>
                    <Link href={`/admin/orders/${order.id}`}>Review order</Link>
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