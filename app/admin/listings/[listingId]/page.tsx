// app/admin/listings/[listingId]/page.tsx
import Link from "next/link"
import { notFound } from "next/navigation"
import { requireAdmin } from "@/app/lib/admin/requireAdmin"
import { createAdminSupabaseClient } from "@/app/lib/admin/supabaseAdmin"
import styles from "../../admin.module.css"

type PageProps = {
  params: Promise<{
    listingId: string
  }>
}

type ListingRow = {
  id: string
  seller_id: string
  category_id: string | null
  title: string
  description: string | null
  price: number | null
  quantity: number | null
  condition: string | null
  event_type: string | null
  style: string | null
  primary_color: string | null
  secondary_color: string | null
  fulfillment_type: string | null
  shipping_origin_zip: string | null
  package_weight_lb: number | null
  package_length_in: number | null
  package_width_in: number | null
  package_height_in: number | null
  status: string
  sold_at: string | null
  created_at: string
  updated_at: string | null
}

type ProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  email: string | null
}

type CategoryRow = {
  id: string
  name: string
  slug: string | null
}

type ListingImageRow = {
  id: string
  image_url: string
  is_primary: boolean
  sort_order: number
}

type ListingReportRow = {
  id: string
  reporter_id: string | null
  listing_id: string
  status: string
  reason: string | null
  details: string | null
  created_at: string
}

type OrderRow = {
  id: string
  status: string
  buyer_id: string
  seller_id: string
  total: number | null
  fulfillment_method: string | null
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

function buildConfirmationNumber(orderId: string) {
  const clean = orderId.replace(/-/g, "").toUpperCase()
  return `DE-${clean.slice(0, 4)}-${clean.slice(-6)}`
}

function getPackageSummary(listing: ListingRow) {
  if (
    !listing.package_weight_lb &&
    !listing.package_length_in &&
    !listing.package_width_in &&
    !listing.package_height_in
  ) {
    return "No package details"
  }

  const dimensions =
    listing.package_length_in &&
    listing.package_width_in &&
    listing.package_height_in
      ? `${listing.package_length_in} × ${listing.package_width_in} × ${listing.package_height_in} in`
      : "Missing dimensions"

  const weight = listing.package_weight_lb
    ? `${listing.package_weight_lb} lb`
    : "Missing weight"

  return `${weight} · ${dimensions}`
}

export default async function AdminListingDetailPage({ params }: PageProps) {
  const { listingId } = await params
  const { admin } = await requireAdmin(`/admin/listings/${listingId}`)

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

  const { data: listingData, error: listingError } = await supabase
    .from("listings")
    .select(
      "id, seller_id, category_id, title, description, price, quantity, condition, event_type, style, primary_color, secondary_color, fulfillment_type, shipping_origin_zip, package_weight_lb, package_length_in, package_width_in, package_height_in, status, sold_at, created_at, updated_at"
    )
    .eq("id", listingId)
    .single()

  if (listingError || !listingData) {
    notFound()
  }

  const listing = listingData as ListingRow

  const [
    { data: sellerData },
    { data: categoryData },
    { data: imageData },
    { data: reportData },
    { data: orderData },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, full_name, email")
      .eq("id", listing.seller_id)
      .maybeSingle(),
    listing.category_id
      ? supabase
          .from("categories")
          .select("id, name, slug")
          .eq("id", listing.category_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("listing_images")
      .select("id, image_url, is_primary, sort_order")
      .eq("listing_id", listing.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("listing_reports")
      .select("id, reporter_id, listing_id, status, reason, details, created_at")
      .eq("listing_id", listing.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("id, status, buyer_id, seller_id, total, fulfillment_method, created_at")
      .eq("listing_id", listing.id)
      .order("created_at", { ascending: false }),
  ])

  const seller = (sellerData || null) as ProfileRow | null
  const category = (categoryData || null) as CategoryRow | null
  const images = (imageData || []) as ListingImageRow[]
  const reports = (reportData || []) as ListingReportRow[]
  const orders = (orderData || []) as OrderRow[]

  const openReports = reports.filter((report) =>
    ["open", "in_review"].includes(report.status)
  )

  return (
    <main className={styles.adminPage}>
      <section className={styles.adminShell}>
        <header className={styles.adminHeader}>
          <Link href="/admin/listings">Listings</Link>
          <strong className={styles.adminBrand}>Listing Detail</strong>
          <Link href="/admin/support">Support</Link>
        </header>

        <section className={styles.adminHero}>
          <p>{formatLabel(listing.status)}</p>
          <h1>{listing.title || "Decor listing"}</h1>
          <span>
            Internal review for listing quality, seller details, fulfillment
            readiness, report activity, and related orders.
          </span>
        </section>

        <section className={styles.adminDetailGrid}>
          <article className={styles.adminDetailCard}>
            <span>Price</span>
            <strong>{formatMoney(listing.price)}</strong>
            <p>Quantity: {listing.quantity || 0}</p>
          </article>

          <article className={styles.adminDetailCard}>
            <span>Status</span>
            <strong>{formatLabel(listing.status)}</strong>
            <p>Updated {formatDateTime(listing.updated_at || listing.created_at)}</p>
          </article>

          <article className={styles.adminDetailCard}>
            <span>Reports</span>
            <strong>{openReports.length}</strong>
            <p>{reports.length} total report records</p>
          </article>
        </section>

        <section className={styles.adminTwoColumn}>
          <article className={styles.adminPanel}>
            <div className={styles.adminPanelHeader}>
              <span>Seller</span>
              <strong>{getProfileName(seller)}</strong>
            </div>
            <p>{seller?.email || "No seller email found."}</p>
          </article>

          <article className={styles.adminPanel}>
            <div className={styles.adminPanelHeader}>
              <span>Category</span>
              <strong>{category?.name || "Uncategorized"}</strong>
            </div>
            <p>{category?.slug || "No category slug."}</p>
          </article>
        </section>

        <section className={styles.adminPanel}>
          <div className={styles.adminPanelHeader}>
            <span>Listing details</span>
            <strong>{formatLabel(listing.event_type)}</strong>
          </div>

          <div className={styles.adminKeyValueList}>
            <div>
              <span>Condition</span>
              <strong>{formatLabel(listing.condition)}</strong>
            </div>

            <div>
              <span>Style</span>
              <strong>{formatLabel(listing.style)}</strong>
            </div>

            <div>
              <span>Primary color</span>
              <strong>{formatLabel(listing.primary_color)}</strong>
            </div>

            <div>
              <span>Secondary color</span>
              <strong>{formatLabel(listing.secondary_color)}</strong>
            </div>
          </div>

          {listing.description ? <p>{listing.description}</p> : null}
        </section>

        <section className={styles.adminPanel}>
          <div className={styles.adminPanelHeader}>
            <span>Fulfillment</span>
            <strong>{formatLabel(listing.fulfillment_type)}</strong>
          </div>

          <div className={styles.adminKeyValueList}>
            <div>
              <span>Origin ZIP</span>
              <strong>{listing.shipping_origin_zip || "Not set"}</strong>
            </div>

            <div>
              <span>Package</span>
              <strong>{getPackageSummary(listing)}</strong>
            </div>
          </div>
        </section>

        <section className={styles.adminPanel}>
          <div className={styles.adminPanelHeader}>
            <span>Images</span>
            <strong>{images.length}</strong>
          </div>

          {images.length === 0 ? (
            <p>No listing images found.</p>
          ) : (
            <div className={styles.adminImageGrid}>
              {images.map((image) => (
                <div key={image.id} className={styles.adminImageTile}>
                  <img src={image.image_url} alt={listing.title} />
                  {image.is_primary ? <span>Primary</span> : null}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={styles.adminPanel}>
          <div className={styles.adminPanelHeader}>
            <span>Reports</span>
            <strong>{reports.length}</strong>
          </div>

          {reports.length === 0 ? (
            <p>No reports found for this listing.</p>
          ) : (
            <div className={styles.adminMiniList}>
              {reports.map((report) => (
                <article key={report.id}>
                  <span>
                    {formatLabel(report.status)} · {formatDateTime(report.created_at)}
                  </span>
                  <strong>{report.reason || "No reason provided"}</strong>
                  {report.details ? <p>{report.details}</p> : null}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={styles.adminPanel}>
          <div className={styles.adminPanelHeader}>
            <span>Related orders</span>
            <strong>{orders.length}</strong>
          </div>

          {orders.length === 0 ? (
            <p>No orders found for this listing.</p>
          ) : (
            <div className={styles.adminMiniList}>
              {orders.map((order) => (
                <article key={order.id}>
                  <span>
                    {formatLabel(order.status)} · {formatDateTime(order.created_at)}
                  </span>
                  <strong>{buildConfirmationNumber(order.id)}</strong>
                  <p>
                    {formatMoney(order.total)} ·{" "}
                    {formatLabel(order.fulfillment_method)}
                  </p>
                  <div className={styles.adminSupportActions}>
                    <Link href={`/admin/orders/${order.id}`}>Review order</Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className={styles.adminSupportActions}>
          <Link href={`/listing/${listing.id}`}>View public listing</Link>
          <Link href="/admin/listings">Back to listings</Link>
        </div>
      </section>
    </main>
  )
}