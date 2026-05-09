// app/admin/listings/page.tsx
import Link from "next/link"
import { requireAdmin } from "@/app/lib/admin/requireAdmin"
import { createAdminSupabaseClient } from "@/app/lib/admin/supabaseAdmin"
import styles from "../admin.module.css"

type ListingRow = {
  id: string
  seller_id: string
  category_id: string | null
  title: string
  description: string | null
  price: number | null
  quantity: number | null
  status: string
  fulfillment_type: string | null
  shipping_origin_zip: string | null
  package_weight_lb: number | null
  package_length_in: number | null
  package_width_in: number | null
  package_height_in: number | null
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

type ListingReportRow = {
  id: string
  listing_id: string
  status: string
  reason: string | null
  created_at: string
}

function formatMoney(value: number | null | undefined) {
  return `$${Number(value || 0).toFixed(2)}`
}

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

function getProfileName(profile: ProfileRow | undefined) {
  if (!profile) return "Unknown seller"

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ")

  return name || profile.full_name || profile.email || "Unknown seller"
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

export default async function AdminListingsPage() {
  const { admin } = await requireAdmin("/admin/listings")

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
      "id, seller_id, category_id, title, description, price, quantity, status, fulfillment_type, shipping_origin_zip, package_weight_lb, package_length_in, package_width_in, package_height_in, created_at, updated_at"
    )
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(75)

  const listings = (listingData || []) as ListingRow[]

  const sellerIds = Array.from(
    new Set(listings.map((listing) => listing.seller_id).filter(Boolean))
  )

  const categoryIds = Array.from(
    new Set(
      listings
        .map((listing) => listing.category_id)
        .filter((value): value is string => Boolean(value))
    )
  )

  const listingIds = listings.map((listing) => listing.id)

  const [{ data: profileData }, { data: categoryData }, { data: reportData }] =
    await Promise.all([
      sellerIds.length > 0
        ? supabase
            .from("profiles")
            .select("id, first_name, last_name, full_name, email")
            .in("id", sellerIds)
        : Promise.resolve({ data: [] }),
      categoryIds.length > 0
        ? supabase
            .from("categories")
            .select("id, name, slug")
            .in("id", categoryIds)
        : Promise.resolve({ data: [] }),
      listingIds.length > 0
        ? supabase
            .from("listing_reports")
            .select("id, listing_id, status, reason, created_at")
            .in("listing_id", listingIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
    ])

  const profiles = (profileData || []) as ProfileRow[]
  const categories = (categoryData || []) as CategoryRow[]
  const reports = (reportData || []) as ListingReportRow[]

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]))
  const categoriesById = new Map(
    categories.map((category) => [category.id, category])
  )

  const reportsByListingId = new Map<string, ListingReportRow[]>()

  reports.forEach((report) => {
    const existing = reportsByListingId.get(report.listing_id) || []
    reportsByListingId.set(report.listing_id, [...existing, report])
  })

  const publishedCount = listings.filter(
    (listing) => listing.status === "published"
  ).length

  const draftCount = listings.filter(
    (listing) => listing.status === "draft"
  ).length

  const pausedCount = listings.filter(
    (listing) => listing.status === "paused"
  ).length

  const soldCount = listings.filter((listing) => listing.status === "sold").length

  const reportedCount = reports.filter((report) =>
    ["open", "in_review"].includes(report.status)
  ).length

  return (
    <main className={styles.adminPage}>
      <section className={styles.adminShell}>
        <header className={styles.adminHeader}>
          <Link href="/admin">Dashboard</Link>
          <strong className={styles.adminBrand}>Listing Moderation</strong>
          <Link href="/admin/support">Support</Link>
        </header>

        <section className={styles.adminHero}>
          <p>Admin listings</p>
          <h1>Listings</h1>
          <span>
            Review marketplace listings, seller details, fulfillment setup,
            package readiness, and report activity.
          </span>
        </section>

        <section className={styles.adminStatGrid}>
          <div className={styles.adminStatCard}>
            <span>Published</span>
            <strong>{publishedCount}</strong>
          </div>

          <div className={styles.adminStatCard}>
            <span>Drafts</span>
            <strong>{draftCount}</strong>
          </div>

          <div className={styles.adminStatCard}>
            <span>Paused</span>
            <strong>{pausedCount}</strong>
          </div>

          <div className={styles.adminStatCard}>
            <span>Sold</span>
            <strong>{soldCount}</strong>
          </div>

          <div className={styles.adminStatCard}>
            <span>Open reports</span>
            <strong>{reportedCount}</strong>
          </div>
        </section>

        {listingError ? (
          <section className={styles.adminStateCard}>
            <h2>Listings unavailable</h2>
            <p>{listingError.message}</p>
          </section>
        ) : null}

        {!listingError && listings.length === 0 ? (
          <section className={styles.adminStateCard}>
            <h2>No listings found</h2>
            <p>Marketplace listings will appear here once sellers create them.</p>
          </section>
        ) : null}

        {!listingError && listings.length > 0 ? (
          <section className={styles.adminList}>
            {listings.map((listing) => {
              const seller = profilesById.get(listing.seller_id)
              const category = listing.category_id
                ? categoriesById.get(listing.category_id)
                : undefined
              const listingReports = reportsByListingId.get(listing.id) || []
              const openReports = listingReports.filter((report) =>
                ["open", "in_review"].includes(report.status)
              )

              return (
                <article key={listing.id} className={styles.adminSupportCard}>
                  <div className={styles.adminSupportTop}>
                    <div>
                      <span>{formatLabel(listing.status)}</span>
                      <h2>{listing.title || "Untitled listing"}</h2>
                    </div>

                    <strong>{formatMoney(listing.price)}</strong>
                  </div>

                  <div className={styles.adminSupportMeta}>
                    <div>
                      <span>Seller</span>
                      <strong>{getProfileName(seller)}</strong>
                    </div>

                    <div>
                      <span>Category</span>
                      <strong>{category?.name || "Uncategorized"}</strong>
                    </div>

                    <div>
                      <span>Fulfillment</span>
                      <strong>{formatLabel(listing.fulfillment_type)}</strong>
                    </div>

                    <div>
                      <span>Quantity</span>
                      <strong>{listing.quantity || 0}</strong>
                    </div>

                    <div>
                      <span>Updated</span>
                      <strong>{formatDate(listing.updated_at || listing.created_at)}</strong>
                    </div>
                  </div>

                  <div className={styles.adminMoneyGrid}>
                    <div>
                      <span>Origin ZIP</span>
                      <strong>{listing.shipping_origin_zip || "Not set"}</strong>
                    </div>

                    <div>
                      <span>Package</span>
                      <strong>{getPackageSummary(listing)}</strong>
                    </div>

                    <div>
                      <span>Reports</span>
                      <strong>
                        {openReports.length > 0
                          ? `${openReports.length} open`
                          : `${listingReports.length} total`}
                      </strong>
                    </div>
                  </div>

                  {listing.description ? (
                    <p className={styles.adminSupportMessage}>
                      {listing.description.length > 220
                        ? `${listing.description.slice(0, 220)}...`
                        : listing.description}
                    </p>
                  ) : null}

                  {openReports.length > 0 ? (
                    <div className={styles.adminMiniList}>
                      {openReports.slice(0, 3).map((report) => (
                        <article key={report.id}>
                          <span>
                            Report · {formatLabel(report.status)} ·{" "}
                            {formatDate(report.created_at)}
                          </span>
                          <strong>{report.reason || "No reason provided"}</strong>
                        </article>
                      ))}
                    </div>
                  ) : null}

                  <div className={styles.adminSupportActions}>
                    <Link href={`/listing/${listing.id}`}>View public listing</Link>
                    <Link href={`/admin/listings/${listing.id}`}>Review listing</Link>
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