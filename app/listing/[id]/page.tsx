"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/app/lib/supabase/client"
import styles from "./listing-detail.module.css"

type CategoryRecord = {
  name: string
  slug: string
}

type ListingImageRecord = {
  image_url: string
  is_primary: boolean
  sort_order: number
}

type ListingRow = {
  id: string
  seller_id: string
  title: string
  description: string | null
  price: number
  condition: string
  quantity: number
  event_type: string
  style: string | null
  primary_color: string | null
  secondary_color: string | null
  fulfillment_type: string
  shipping_price: number | null
  pickup_zip: string | null
  pickup_city: string | null
  pickup_state: string | null
  is_bundle: boolean
  bundle_guest_count: number | null
  bundle_includes: string | null
  created_at: string
  categories: CategoryRecord[] | CategoryRecord | null
  listing_images: ListingImageRecord[]
}

type SellerProfile = {
  first_name: string | null
  last_name: string | null
  full_name: string | null
  city: string | null
  state: string | null
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M15 6l-6 6 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 6.5A3.5 3.5 0 018.5 3h7A3.5 3.5 0 0119 6.5v5A3.5 3.5 0 0115.5 15H10l-5 4v-4.8A3.5 3.5 0 015 12V6.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function formatCondition(value: string) {
  const labels: Record<string, string> = {
    new: "New",
    like_new: "Like new",
    used_once: "Used once",
    good: "Good",
    fair: "Fair",
  }

  return labels[value] || value
}

function formatEventType(value: string) {
  const labels: Record<string, string> = {
    wedding: "Wedding",
    quinceanera: "Quinceañera",
    baby_shower: "Baby shower",
    graduation: "Graduation",
    corporate: "Corporate",
    birthday: "Birthday",
    engagement_party: "Engagement party",
    bridal_shower: "Bridal shower",
    holiday: "Holiday",
    other: "Other",
  }

  return labels[value] || value
}

function formatFulfillment(value: string) {
  const labels: Record<string, string> = {
    pickup: "Pickup",
    shipping: "Shipping",
    pickup_or_shipping: "Pickup or shipping",
  }

  return labels[value] || value
}

function formatCategory(category: CategoryRecord[] | CategoryRecord | null) {
  if (!category) return "Event Decor"

  if (Array.isArray(category)) {
    return category[0]?.name || "Event Decor"
  }

  return category.name || "Event Decor"
}

function formatLocation(listing: ListingRow) {
  if (listing.pickup_city && listing.pickup_state) {
    return `${listing.pickup_city}, ${listing.pickup_state}`
  }

  if (listing.pickup_city) return listing.pickup_city
  if (listing.pickup_state) return listing.pickup_state

  return "Location available from seller"
}

function getSortedImages(images: ListingImageRecord[]) {
  return [...(images || [])].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.sort_order - b.sort_order
  })
}

function getSellerName(profile: SellerProfile | null) {
  if (!profile) return "Seller"

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ")

  return name || profile.full_name || "Seller"
}

export default function ListingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = useMemo(() => createClient(), [])

  const listingId = Array.isArray(params.id) ? params.id[0] : params.id

  const [listing, setListing] = useState<ListingRow | null>(null)
  const [seller, setSeller] = useState<SellerProfile | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [userId, setUserId] = useState("")

  useEffect(() => {
    let mounted = true

    async function loadListing() {
      if (!listingId) return

      setLoading(true)
      setError("")

      const { data, error: listingError } = await supabase
        .from("listings")
        .select(
          `
          id,
          seller_id,
          title,
          description,
          price,
          condition,
          quantity,
          event_type,
          style,
          primary_color,
          secondary_color,
          fulfillment_type,
          shipping_price,
          pickup_zip,
          pickup_city,
          pickup_state,
          is_bundle,
          bundle_guest_count,
          bundle_includes,
          created_at,
          categories (
            name,
            slug
          ),
          listing_images (
            image_url,
            is_primary,
            sort_order
          )
        `
        )
        .eq("id", listingId)
        .eq("status", "published")
        .single()

      if (!mounted) return

      if (listingError || !data) {
        setError("Listing not found.")
        setListing(null)
        setLoading(false)
        return
      }

      const normalizedListing = data as unknown as ListingRow

      setListing(normalizedListing)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user && mounted) {
        setUserId(user.id)

        const { data: favoriteRow } = await supabase
            .from("favorites")
            .select("id")
            .eq("user_id", user.id)
            .eq("listing_id", normalizedListing.id)
            .maybeSingle()

        setSaved(Boolean(favoriteRow))
      }

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, full_name, city, state")
          .eq("id", normalizedListing.seller_id)
          .single()

        if (mounted) {
          setSeller((profile || null) as SellerProfile | null)
        }
      }

      setLoading(false)
    }

    loadListing()

    return () => {
      mounted = false
    }
  }, [listingId, supabase])

  const images = useMemo(() => {
    return listing ? getSortedImages(listing.listing_images || []) : []
  }, [listing])

  const selectedImage = images[selectedImageIndex]?.image_url || ""

  async function toggleFavorite() {
    if (!listing) return

    if (!userId) {
      router.push(
          `/login?next=${encodeURIComponent(`/listing/${listing.id}`)}&reason=favorite`
      )
      return
    }

    const currentlySaved = saved
    setSaved(!currentlySaved)

    if (currentlySaved) {
        const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("listing_id", listing.id)

        if (error) {
        setSaved(true)
        }

        return
    }

    const { error } = await supabase.from("favorites").insert({
        user_id: userId,
        listing_id: listing.id,
    })

    if (error) {
        setSaved(false)
    }
    }

  if (loading) {
    return (
      <main className={styles.detailPage}>
        <section className={styles.stateCard}>
          <h1>Loading listing</h1>
          <p>Getting the details.</p>
        </section>
      </main>
    )
  }

  if (error || !listing) {
    return (
      <main className={styles.detailPage}>
        <section className={styles.stateCard}>
          <h1>Listing not found</h1>
          <p>This listing may have been removed or sold.</p>
          <Link href="/marketplace">Back to marketplace</Link>
        </section>
      </main>
    )
  }

  const categoryName = formatCategory(listing.categories)
  const location = formatLocation(listing)
  const sellerName = getSellerName(seller)

  return (
    <main className={styles.detailPage}>
      <header className={styles.detailTopbar}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => router.back()}
          aria-label="Go back"
        >
          <BackIcon />
        </button>

        <Link href="/marketplace" className={styles.brandPill}>
          <span>D</span>
          <strong>Decor Encore</strong>
        </Link>

        <button
          type="button"
          className={`${styles.saveTopButton} ${saved ? styles.isSaved : ""}`}
          onClick={toggleFavorite}
          aria-label={saved ? "Remove favorite" : "Save listing"}
        >
          <HeartIcon filled={saved} />
        </button>
      </header>

      <section className={styles.detailShell}>
        <section className={styles.imageSection}>
          <div className={styles.heroImageWrap}>
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={listing.title}
                className={styles.heroImage}
              />
            ) : (
              <div className={styles.heroImageFallback} />
            )}

            {listing.is_bundle ? (
              <span className={styles.imageBadge}>Bundle</span>
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className={styles.thumbnailRail} aria-label="Listing photos">
              {images.map((image, index) => (
                <button
                  key={`${image.image_url}-${index}`}
                  type="button"
                  className={`${styles.thumbnailButton} ${
                    selectedImageIndex === index ? styles.thumbnailActive : ""
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
                  aria-label={`View photo ${index + 1}`}
                >
                  <img src={image.image_url} alt="" />
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className={styles.contentSection}>
          <div className={styles.titleBlock}>
            <p>{categoryName}</p>
            <h1>{listing.title}</h1>
            <strong>${Number(listing.price || 0).toFixed(0)}</strong>
          </div>

          <div className={styles.actionRow}>
            <button
              type="button"
              className={`${styles.favoriteButton} ${saved ? styles.isSaved : ""}`}
              onClick={toggleFavorite}
            >
              <HeartIcon filled={saved} />
              <span>{saved ? "Saved" : "Save"}</span>
            </button>

            <Link
              href={`/messages?listingId=${listing.id}`}
              className={styles.messageButton}
            >
              <MessageIcon />
              <span>Contact seller</span>
            </Link>
          </div>

          <section className={styles.infoGrid}>
            <article>
              <span>Condition</span>
              <strong>{formatCondition(listing.condition)}</strong>
            </article>

            <article>
              <span>Quantity</span>
              <strong>{listing.quantity}</strong>
            </article>

            <article>
              <span>Event</span>
              <strong>{formatEventType(listing.event_type)}</strong>
            </article>

            <article>
              <span>Location</span>
              <strong>{location}</strong>
            </article>
          </section>

          <section className={styles.detailCard}>
            <h2>Details</h2>

            {listing.description ? <p>{listing.description}</p> : null}

            <div className={styles.detailList}>
              {listing.style ? (
                <div>
                  <span>Style</span>
                  <strong>{listing.style}</strong>
                </div>
              ) : null}

              {listing.primary_color ? (
                <div>
                  <span>Color</span>
                  <strong>
                    {listing.primary_color}
                    {listing.secondary_color ? ` / ${listing.secondary_color}` : ""}
                  </strong>
                </div>
              ) : null}

              <div>
                <span>Fulfillment</span>
                <strong>{formatFulfillment(listing.fulfillment_type)}</strong>
              </div>

              {listing.shipping_price !== null &&
              (listing.fulfillment_type === "shipping" ||
                listing.fulfillment_type === "pickup_or_shipping") ? (
                <div>
                  <span>Shipping</span>
                  <strong>${Number(listing.shipping_price || 0).toFixed(0)}</strong>
                </div>
              ) : null}

              {listing.pickup_zip ? (
                <div>
                  <span>Pickup ZIP</span>
                  <strong>{listing.pickup_zip}</strong>
                </div>
              ) : null}
            </div>
          </section>

          {listing.is_bundle ? (
            <section className={styles.detailCard}>
              <h2>Bundle</h2>

              <div className={styles.detailList}>
                {listing.bundle_guest_count ? (
                  <div>
                    <span>Guest count</span>
                    <strong>{listing.bundle_guest_count}</strong>
                  </div>
                ) : null}

                {listing.bundle_includes ? (
                  <div>
                    <span>Includes</span>
                    <strong>{listing.bundle_includes}</strong>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className={styles.sellerCard}>
            <div className={styles.sellerAvatar}>
              {sellerName.charAt(0).toUpperCase()}
            </div>

            <div>
              <span>Seller</span>
              <strong>{sellerName}</strong>
              <p>
                {seller?.city && seller?.state
                  ? `${seller.city}, ${seller.state}`
                  : "Message seller for details"}
              </p>
            </div>
          </section>
        </section>
      </section>

      <nav className={styles.detailBottomBar}>
        <div>
          <span>Total</span>
          <strong>${Number(listing.price || 0).toFixed(0)}</strong>
        </div>

        <Link href={`/messages?listingId=${listing.id}`}>
          <MessageIcon />
          Contact seller
        </Link>
      </nav>
    </main>
  )
}