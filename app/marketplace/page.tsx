// app/marketplace/page.tsx
"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/app/lib/supabase/client"
import {
  Coordinates,
  getDistanceMiles,
} from "@/app/lib/zipCoordinates"
import AppBottomNav from "@/app/components/AppBottomNav"

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
  pickup_zip: string | null
  pickup_lat: number | null
  pickup_lng: number | null
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
  rawCondition: string
  category: string
  eventType: string
  style: string
  primaryColor: string
  secondaryColor: string
  fulfillmentType: string
  badge: string
  imageUrl: string
  isBundle: boolean
  isSaved: boolean
  createdAt: string
  pickupZip: string
  pickupLat: number | null
  pickupLng: number | null
  distanceMiles: number | null
}

type FilterState = {
  condition: string
  fulfillmentType: string
  maxPrice: string
  bundleOnly: boolean
  radiusMiles: string
}

const emptyFilters: FilterState = {
  condition: "",
  fulfillmentType: "",
  maxPrice: "",
  bundleOnly: false,
  radiusMiles: "",
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

const conditionOptions = [
  { label: "New", value: "new" },
  { label: "Like new", value: "like_new" },
  { label: "Used once", value: "used_once" },
  { label: "Good", value: "good" },
  { label: "Fair", value: "fair" },
]

const fulfillmentOptions = [
  { label: "Pickup", value: "pickup" },
  { label: "Ships", value: "shipping" },
  { label: "Pickup or ships", value: "pickup_or_shipping" },
]

const radiusOptions = [
  { label: "10 mi", value: "10" },
  { label: "25 mi", value: "25" },
  { label: "50 mi", value: "50" },
  { label: "100 mi", value: "100" },
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

function formatDistance(distanceMiles: number | null) {
  if (distanceMiles === null) return ""

  if (distanceMiles < 1) return "less than 1 mi away"

  return `${Math.round(distanceMiles)} mi away`
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
  saved: Record<string, boolean>,
  buyerCoordinates: Coordinates | null
): MarketplaceListing {
  const hasPickupCoordinates =
    typeof listing.pickup_lat === "number" &&
    typeof listing.pickup_lng === "number"

  const listingCoordinates = hasPickupCoordinates
    ? {
        lat: listing.pickup_lat as number,
        lng: listing.pickup_lng as number,
      }
    : null

  const distanceMiles =
    buyerCoordinates && listingCoordinates
      ? getDistanceMiles(buyerCoordinates, listingCoordinates)
      : null

  return {
    id: listing.id,
    title: listing.title,
    price: Number(listing.price || 0),
    location: formatLocation(listing.pickup_city, listing.pickup_state),
    condition: formatCondition(listing.condition),
    rawCondition: listing.condition,
    category: getCategoryName(listing.categories),
    eventType: listing.event_type,
    style: listing.style || "",
    primaryColor: listing.primary_color || "",
    secondaryColor: listing.secondary_color || "",
    fulfillmentType: listing.fulfillment_type,
    badge: formatBadge(listing.fulfillment_type, listing.is_bundle),
    imageUrl: getPrimaryImage(listing.listing_images || []),
    isBundle: listing.is_bundle,
    isSaved: Boolean(saved[listing.id]),
    createdAt: listing.created_at,
    pickupZip: listing.pickup_zip || "",
    pickupLat: listing.pickup_lat,
    pickupLng: listing.pickup_lng,
    distanceMiles,
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
  const [buyerCoordinates, setBuyerCoordinates] = useState<Coordinates | null>(
    null
  )
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState<FilterState>(emptyFilters)
  const [activeFilters, setActiveFilters] = useState<FilterState>(emptyFilters)

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

        const [{ data: favoriteRows }, { data: profile }] = await Promise.all([
          supabase
            .from("favorites")
            .select("listing_id")
            .eq("user_id", user.id),
          supabase
            .from("profiles")
            .select("zip_lat, zip_lng")
            .eq("id", user.id)
            .single(),
        ])

        const favoriteMap: Record<string, boolean> = {}

        ;(favoriteRows || []).forEach((row) => {
          favoriteMap[row.listing_id] = true
        })

        setSaved(favoriteMap)

        if (
          typeof profile?.zip_lat === "number" &&
          typeof profile?.zip_lng === "number"
        ) {
          setBuyerCoordinates({
            lat: profile.zip_lat,
            lng: profile.zip_lng,
          })
        } else {
          setBuyerCoordinates(null)
        }
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
          pickup_zip,
          pickup_lat,
          pickup_lng,
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
    return listings.map((listing) =>
      toMarketplaceListing(listing, saved, buyerCoordinates)
    )
  }, [listings, saved, buyerCoordinates])

  const activeFilterCount = useMemo(() => {
    let count = 0

    if (activeFilters.condition) count += 1
    if (activeFilters.fulfillmentType) count += 1
    if (activeFilters.maxPrice) count += 1
    if (activeFilters.bundleOnly) count += 1
    if (activeFilters.radiusMiles) count += 1

    return count
  }, [activeFilters])

  const radiusNeedsProfile =
    Boolean(activeFilters.radiusMiles) && !buyerCoordinates

  const filteredListings = useMemo(() => {
    let next = marketplaceListings

    if (view === "bundles") {
      next = next.filter((listing) => listing.isBundle)
    }

    if (view === "saved") {
      next = next.filter((listing) => listing.isSaved)
    }

    if (view === "nearby") {
      if (buyerCoordinates) {
        next = next.filter(
          (listing) =>
            listing.distanceMiles !== null && listing.distanceMiles <= 25
        )
      } else {
        next = next.filter((listing) =>
          listing.location.toLowerCase().includes("tampa")
        )
      }
    }

    if (selectedEventType) {
      next = next.filter((listing) => listing.eventType === selectedEventType)
    }

    if (activeFilters.condition) {
      next = next.filter(
        (listing) => listing.rawCondition === activeFilters.condition
      )
    }

    if (activeFilters.fulfillmentType) {
      next = next.filter(
        (listing) => listing.fulfillmentType === activeFilters.fulfillmentType
      )
    }

    if (activeFilters.bundleOnly) {
      next = next.filter((listing) => listing.isBundle)
    }

    const maxPrice = Number(activeFilters.maxPrice)

    if (activeFilters.maxPrice && !Number.isNaN(maxPrice)) {
      next = next.filter((listing) => listing.price <= maxPrice)
    }

    const radiusMiles = Number(activeFilters.radiusMiles)

    if (
      activeFilters.radiusMiles &&
      !Number.isNaN(radiusMiles) &&
      buyerCoordinates
    ) {
      next = next.filter(
        (listing) =>
          listing.distanceMiles !== null && listing.distanceMiles <= radiusMiles
      )
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
          listing.primaryColor.toLowerCase().includes(cleanQuery) ||
          listing.secondaryColor.toLowerCase().includes(cleanQuery) ||
          listing.pickupZip.toLowerCase().includes(cleanQuery)
        )
      })
    }

    return next
  }, [
    marketplaceListings,
    query,
    selectedEventType,
    view,
    activeFilters,
    buyerCoordinates,
  ])

  function openFilters() {
    setDraftFilters(activeFilters)
    setFiltersOpen(true)
  }

  function closeFilters() {
    setFiltersOpen(false)
  }

  function clearFilters() {
    setDraftFilters(emptyFilters)
    setActiveFilters(emptyFilters)
    setFiltersOpen(false)
  }

  function applyFilters() {
    setActiveFilters(draftFilters)
    setFiltersOpen(false)
  }

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
            className={`mk-filter-button ${
              activeFilterCount > 0 ? "has-filters" : ""
            }`}
            aria-label="Open filters"
            title="Open filters"
            onClick={openFilters}
          >
            <FilterIcon />
            {activeFilterCount > 0 ? (
              <span className="mk-filter-count">{activeFilterCount}</span>
            ) : null}
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
          <h2>A Story in Every Piece.</h2>
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

      {radiusNeedsProfile ? (
        <section className="mk-empty">
          <div>
            <h2>Add your ZIP</h2>
            <p>Save your ZIP in your profile to use nearby radius filters.</p>
          </div>
        </section>
      ) : null}

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
          filteredListings.map((listing) => {
            const distanceLabel = formatDistance(listing.distanceMiles)

            return (
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
                        {listing.location}
                        {distanceLabel ? ` · ${distanceLabel}` : ""} ·{" "}
                        {listing.condition}
                      </span>
                    </div>
                  </div>
                </Link>

                <button
                  type="button"
                  className={`mk-save-button ${
                    listing.isSaved ? "is-saved" : ""
                  }`}
                  onClick={() => toggleSaved(listing.id)}
                  aria-label={
                    listing.isSaved ? "Remove favorite" : "Save listing"
                  }
                >
                  ♥
                </button>
              </article>
            )
          })
        ) : (
          <div className="mk-empty">
            <h2>No listings found</h2>
            <p>Try another search or adjust your filters.</p>
          </div>
        )}
      </section>

      {filtersOpen ? (
        <div
          className="mk-filter-overlay"
          role="presentation"
          onClick={closeFilters}
        >
          <section
            className="mk-filter-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Marketplace filters"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mk-filter-sheet-header">
              <div>
                <p>Refine</p>
                <h2>Filters</h2>
              </div>

              <button
                type="button"
                className="mk-filter-close"
                onClick={closeFilters}
                aria-label="Close filters"
              >
                ×
              </button>
            </div>

            <div className="mk-filter-group">
              <p className="mk-filter-label">Condition</p>
              <div className="mk-filter-chip-grid">
                {conditionOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`mk-filter-chip ${
                      draftFilters.condition === option.value ? "is-active" : ""
                    }`}
                    onClick={() =>
                      setDraftFilters((current) => ({
                        ...current,
                        condition:
                          current.condition === option.value ? "" : option.value,
                      }))
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mk-filter-group">
              <label className="mk-filter-label" htmlFor="maxPrice">
                Max price
              </label>

              <div className="mk-price-input-shell">
                <span>$</span>
                <input
                  id="maxPrice"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={draftFilters.maxPrice}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      maxPrice: event.target.value,
                    }))
                  }
                  placeholder="No limit"
                />
              </div>
            </div>

            <div className="mk-filter-group">
              <p className="mk-filter-label">Distance</p>

              {!buyerCoordinates ? (
                <p className="mk-filter-helper">
                  Add your ZIP in your profile to use distance filters.
                </p>
              ) : null}

              <div className="mk-filter-chip-grid">
                {radiusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`mk-filter-chip ${
                      draftFilters.radiusMiles === option.value
                        ? "is-active"
                        : ""
                    }`}
                    onClick={() =>
                      setDraftFilters((current) => ({
                        ...current,
                        radiusMiles:
                          current.radiusMiles === option.value
                            ? ""
                            : option.value,
                      }))
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>


            <div className="mk-filter-group">
              <p className="mk-filter-label">Delivery</p>
              <div className="mk-filter-chip-grid">
                {fulfillmentOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`mk-filter-chip ${
                      draftFilters.fulfillmentType === option.value
                        ? "is-active"
                        : ""
                    }`}
                    onClick={() =>
                      setDraftFilters((current) => ({
                        ...current,
                        fulfillmentType:
                          current.fulfillmentType === option.value
                            ? ""
                            : option.value,
                      }))
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mk-filter-group">
              <button
                type="button"
                className={`mk-filter-toggle ${
                  draftFilters.bundleOnly ? "is-active" : ""
                }`}
                onClick={() =>
                  setDraftFilters((current) => ({
                    ...current,
                    bundleOnly: !current.bundleOnly,
                  }))
                }
              >
                <span>
                  <strong>Bundles only</strong>
                  <small>Show grouped decor sets and full looks.</small>
                </span>
                <i aria-hidden="true" />
              </button>
            </div>

            <div className="mk-filter-actions">
              <button
                type="button"
                className="mk-filter-clear"
                onClick={clearFilters}
              >
                Clear
              </button>

              <button
                type="button"
                className="mk-filter-apply"
                onClick={applyFilters}
              >
                Apply filters
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <AppBottomNav active={view === "nearby" ? "nearby" : "shop"} />
    </main>
  )
}