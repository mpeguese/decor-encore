"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/app/lib/supabase/client"

type FeedView = "for-you" | "nearby" | "bundles" | "saved"

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
  pickup_city: string | null
  pickup_state: string | null
  is_bundle: boolean
  created_at: string
  categories: CategoryRecord[] | CategoryRecord | null
  listing_images: ListingImageRecord[]
}

type MarketplaceListing = {
  id: string
  title: string
  price: number
  location: string
  condition: string
  category: string
  eventType: string
  style: string
  primaryColor: string
  badge: string
  imageUrl: string
  isBundle: boolean
  isSaved: boolean
  createdAt: string
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 7h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4 17h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="9" cy="7" r="2.25" fill="currentColor" />
      <circle cx="15" cy="17" r="2.25" fill="currentColor" />
    </svg>
  )
}

const eventTypes = [
  { label: "Wedding", value: "wedding" },
  { label: "Quinceañera", value: "quinceanera" },
  { label: "Baby shower", value: "baby_shower" },
  { label: "Birthday", value: "birthday" },
  { label: "Graduation", value: "graduation" },
  { label: "Holiday", value: "holiday" },
]

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

function formatBadge(value: string, isBundle: boolean) {
  if (isBundle) return "Bundle"

  const labels: Record<string, string> = {
    pickup: "Pickup",
    shipping: "Ships",
    pickup_or_shipping: "Pickup or ships",
  }

  return labels[value] || "Available"
}

function formatLocation(city: string | null, state: string | null) {
  if (city && state) return `${city}, ${state}`
  if (city) return city
  if (state) return state
  return "Location available"
}

function getPrimaryImage(images: ListingImageRecord[]) {
  if (!images || images.length === 0) return ""

  const sorted = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.sort_order - b.sort_order
  })

  return sorted[0]?.image_url || ""
}

function getCategoryName(category: CategoryRecord[] | CategoryRecord | null) {
  if (!category) return "Event Decor"

  if (Array.isArray(category)) {
    return category[0]?.name || "Event Decor"
  }

  return category.name || "Event Decor"
}

function toMarketplaceListing(
  listing: ListingRow,
  saved: Record<string, boolean>
): MarketplaceListing {
  return {
    id: listing.id,
    title: listing.title,
    price: Number(listing.price || 0),
    location: formatLocation(listing.pickup_city, listing.pickup_state),
    condition: formatCondition(listing.condition),
    category: getCategoryName(listing.categories),
    eventType: listing.event_type,
    style: listing.style || "",
    primaryColor: listing.primary_color || "",
    badge: formatBadge(listing.fulfillment_type, listing.is_bundle),
    imageUrl: getPrimaryImage(listing.listing_images || []),
    isBundle: listing.is_bundle,
    isSaved: Boolean(saved[listing.id]),
    createdAt: listing.created_at,
  }
}

export default function MarketplacePage() {
  const supabase = useMemo(() => createClient(), [])

  const [view, setView] = useState<FeedView>("for-you")
  const [query, setQuery] = useState("")
  const [selectedEventType, setSelectedEventType] = useState("")
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [listings, setListings] = useState<ListingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [userId, setUserId] = useState("")
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadListings() {
      setLoading(true)
      setError("")

      const params = new URLSearchParams(window.location.search)
      const initialView = params.get("view")

      if (
        initialView === "saved" ||
        initialView === "nearby" ||
        initialView === "bundles"
      ) {
        setView(initialView)
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (mounted && user) {
        setUserId(user.id)

        const { data: favoriteRows } = await supabase
          .from("favorites")
          .select("listing_id")
          .eq("user_id", user.id)

        const favoriteMap: Record<string, boolean> = {}

        ;(favoriteRows || []).forEach((row) => {
          favoriteMap[row.listing_id] = true
        })

        setSaved(favoriteMap)

        const { data: conversationRows } = await supabase
          .from("conversations")
          .select("id")
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)

        const conversationIds = (conversationRows || []).map((row) => row.id)

        if (conversationIds.length > 0) {
          const { count } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .in("conversation_id", conversationIds)
            .neq("sender_id", user.id)
            .is("read_at", null)

          setHasUnreadMessages(Boolean(count && count > 0))
        } else {
          setHasUnreadMessages(false)
        }
      }

      if (mounted && user) {
        setUserId(user.id)

        const { data: favoriteRows } = await supabase
          .from("favorites")
          .select("listing_id")
          .eq("user_id", user.id)

        const favoriteMap: Record<string, boolean> = {}

        ;(favoriteRows || []).forEach((row) => {
          favoriteMap[row.listing_id] = true
        })

        setSaved(favoriteMap)
      }

      const { data, error: listingsError } = await supabase
        .from("listings")
        .select(
          `
          id,
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
          pickup_city,
          pickup_state,
          is_bundle,
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
        .eq("status", "published")
        .order("created_at", { ascending: false })

      if (!mounted) return

      if (listingsError) {
        setError(listingsError.message)
        setListings([])
      } else {
        setListings((data || []) as unknown as ListingRow[])
      }

      setLoading(false)
    }

    loadListings()

    return () => {
      mounted = false
    }
  }, [supabase])

  const marketplaceListings = useMemo(() => {
    return listings.map((listing) => toMarketplaceListing(listing, saved))
  }, [listings, saved])

  const filteredListings = useMemo(() => {
    let next = marketplaceListings

    if (view === "bundles") {
      next = next.filter((listing) => listing.isBundle)
    }

    if (view === "saved") {
      next = next.filter((listing) => listing.isSaved)
    }

    if (view === "nearby") {
      next = next.filter((listing) =>
        listing.location.toLowerCase().includes("tampa")
      )
    }

    if (selectedEventType) {
      next = next.filter((listing) => listing.eventType === selectedEventType)
    }

    const cleanQuery = query.trim().toLowerCase()

    if (cleanQuery) {
      next = next.filter((listing) => {
        return (
          listing.title.toLowerCase().includes(cleanQuery) ||
          listing.category.toLowerCase().includes(cleanQuery) ||
          listing.location.toLowerCase().includes(cleanQuery) ||
          listing.condition.toLowerCase().includes(cleanQuery) ||
          listing.style.toLowerCase().includes(cleanQuery) ||
          listing.primaryColor.toLowerCase().includes(cleanQuery)
        )
      })
    }

    return next
  }, [marketplaceListings, query, selectedEventType, view])

  async function toggleSaved(id: string) {
    if (!userId) {
      window.location.href = `/login?next=${encodeURIComponent(
        "/marketplace"
      )}&reason=favorite`
      return
    }

    const currentlySaved = Boolean(saved[id])

    setSaved((current) => ({
      ...current,
      [id]: !currentlySaved,
    }))

    if (currentlySaved) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("listing_id", id)

      if (error) {
        setSaved((current) => ({
          ...current,
          [id]: true,
        }))
      }

      return
    }

    const { error } = await supabase.from("favorites").insert({
      user_id: userId,
      listing_id: id,
    })

    if (error) {
      setSaved((current) => ({
        ...current,
        [id]: false,
      }))
    }
  }

  return (
    <main className="mk-page">
      <header className="mk-header">
        <div className="mk-top-row">
          <Link href="/" className="mk-logo" aria-label="Decor Encore home">
            <span className="mk-logo-mark">D</span>
            <span>Decor Encore</span>
          </Link>

          <Link href="/profile" className="mk-avatar" aria-label="Profile">
            M
          </Link>
        </div>

        <div className="mk-search-shell">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mk-search"
            placeholder="Search decor, color, style, location"
            aria-label="Search marketplace"
          />

          <button
            type="button"
            className="mk-filter-button"
            aria-label="Open filters"
            title="Open filters"
          >
            <FilterIcon />
          </button>
        </div>

        <div
          className="mk-view-switch"
          role="tablist"
          aria-label="Marketplace view"
        >
          <button
            type="button"
            className={`mk-view-option ${view === "for-you" ? "is-active" : ""}`}
            onClick={() => setView("for-you")}
            role="tab"
            aria-selected={view === "for-you"}
          >
            For You
          </button>

          <button
            type="button"
            className={`mk-view-option ${view === "nearby" ? "is-active" : ""}`}
            onClick={() => setView("nearby")}
            role="tab"
            aria-selected={view === "nearby"}
          >
            Nearby
          </button>

          <button
            type="button"
            className={`mk-view-option ${view === "bundles" ? "is-active" : ""}`}
            onClick={() => setView("bundles")}
            role="tab"
            aria-selected={view === "bundles"}
          >
            Bundles
          </button>

          <button
            type="button"
            className={`mk-view-option ${view === "saved" ? "is-active" : ""}`}
            onClick={() => setView("saved")}
            role="tab"
            aria-selected={view === "saved"}
          >
            Saved
          </button>

          <span className={`mk-view-slider is-${view}`} />
        </div>
      </header>

      <section className="mk-hero-strip">
        <div>
          <p>Marketplace</p>
          <h1>Find once-loved pieces for your next event.</h1>
        </div>

        <Link href="/seller/listings/new" className="mk-sell-cta">
          Sell
        </Link>
      </section>

      <section className="mk-event-scroller" aria-label="Event types">
        <button
          type="button"
          className={`mk-event-chip ${selectedEventType === "" ? "is-active" : ""}`}
          onClick={() => setSelectedEventType("")}
        >
          All
        </button>

        {eventTypes.map((type) => (
          <button
            key={type.value}
            type="button"
            className={`mk-event-chip ${
              selectedEventType === type.value ? "is-active" : ""
            }`}
            onClick={() => setSelectedEventType(type.value)}
          >
            {type.label}
          </button>
        ))}
      </section>

      <section className="mk-feed" aria-label="Marketplace listings">
        {loading ? (
          <div className="mk-empty">
            <h2>Loading listings</h2>
            <p>Finding the latest decor.</p>
          </div>
        ) : error ? (
          <div className="mk-empty">
            <h2>Unable to load listings</h2>
            <p>{error}</p>
          </div>
        ) : filteredListings.length > 0 ? (
          filteredListings.map((listing) => (
            <article key={listing.id} className="mk-card">
              <Link href={`/listing/${listing.id}`} className="mk-card-link">
                <div className="mk-card-media">
                  {listing.imageUrl ? (
                    <img
                      src={listing.imageUrl}
                      alt={listing.title}
                      className="mk-card-image"
                    />
                  ) : (
                    <div className="mk-card-image-fallback" />
                  )}

                  <div className="mk-card-image-wash" />

                  <span className="mk-card-badge">{listing.badge}</span>
                </div>

                <div className="mk-card-body">
                  <div>
                    <p className="mk-card-category">{listing.category}</p>
                    <h2>{listing.title}</h2>
                  </div>

                  <div className="mk-card-meta">
                    <strong>${listing.price.toFixed(0)}</strong>
                    <span>
                      {listing.location} · {listing.condition}
                    </span>
                  </div>
                </div>
              </Link>

              <button
                type="button"
                className={`mk-save-button ${listing.isSaved ? "is-saved" : ""}`}
                onClick={() => toggleSaved(listing.id)}
                aria-label={listing.isSaved ? "Remove favorite" : "Save listing"}
              >
                ♥
              </button>
            </article>
          ))
        ) : (
          <div className="mk-empty">
            <h2>No listings found</h2>
            <p>Try another search or switch views.</p>
          </div>
        )}
      </section>

      <nav className="mk-bottom-nav" aria-label="Primary navigation">
        <Link href="/marketplace" className="mk-bottom-link is-active">
          Shop
        </Link>

        <Link href="/marketplace?view=nearby" className="mk-bottom-link">
          Nearby
        </Link>

        <Link
          href="/seller/listings/new"
          className="mk-bottom-link mk-bottom-sell"
        >
          Sell
        </Link>

        <Link
          href="/messages"
          className={`mk-bottom-link ${hasUnreadMessages ? "has-unread" : ""}`}
        >
          <span className="nav-label-with-dot">
            Messages
            {hasUnreadMessages ? <span className="nav-unread-dot" /> : null}
          </span>
        </Link>

        <Link href="/profile" className="mk-bottom-link">
          Profile
        </Link>
      </nav>
    </main>
  )
}