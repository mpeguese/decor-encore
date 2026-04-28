"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"

type FeedView = "for-you" | "nearby" | "bundles" | "saved"

type Listing = {
  id: string
  title: string
  price: number
  location: string
  condition: string
  category: string
  badge?: string
  imageUrl: string
  isBundle?: boolean
  isSaved?: boolean
}

const listings: Listing[] = [
  {
    id: "1",
    title: "Blush floral arch with matching aisle pieces",
    price: 420,
    location: "Tampa, FL",
    condition: "Used once",
    category: "Ceremony Decor",
    badge: "Pickup",
    imageUrl: "/mock-listings/floral-arch.jpg",
  },
  {
    id: "2",
    title: "Gold charger plates — set of 120",
    price: 185,
    location: "St. Petersburg, FL",
    condition: "Like new",
    category: "Table Decor",
    badge: "Ships",
    imageUrl: "/mock-listings/gold-chargers.jpg",
  },
  {
    id: "3",
    title: "Sage and ivory shower decor bundle",
    price: 275,
    location: "Orlando, FL",
    condition: "Used once",
    category: "Bundles",
    badge: "Bundle",
    imageUrl: "/mock-listings/sage-bundle.jpg",
    isBundle: true,
  },
  {
    id: "4",
    title: "Acrylic welcome sign with stand",
    price: 95,
    location: "Clearwater, FL",
    condition: "Good",
    category: "Signs",
    badge: "Pickup",
    imageUrl: "/mock-listings/welcome-sign.jpg",
  },
  {
    id: "5",
    title: "Pink balloon frame and party props",
    price: 130,
    location: "Tampa, FL",
    condition: "Used once",
    category: "Balloons & Party Decor",
    badge: "Nearby",
    imageUrl: "/mock-listings/balloon-frame.jpg",
  },
  {
    id: "6",
    title: "Dessert table stands and trays",
    price: 160,
    location: "Lakeland, FL",
    condition: "Like new",
    category: "Cake & Dessert Displays",
    badge: "Ships",
    imageUrl: "/mock-listings/dessert-stands.jpg",
  },
]

const eventTypes = [
  "Wedding",
  "Quinceañera",
  "Baby shower",
  "Birthday",
  "Graduation",
  "Holiday",
]

export default function MarketplacePage() {
  const [view, setView] = useState<FeedView>("for-you")
  const [query, setQuery] = useState("")
  const [saved, setSaved] = useState<Record<string, boolean>>({
    "2": true,
  })

  const filteredListings = useMemo(() => {
    let next = listings.map((listing) => ({
      ...listing,
      isSaved: Boolean(saved[listing.id]),
    }))

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

    const cleanQuery = query.trim().toLowerCase()

    if (cleanQuery) {
      next = next.filter((listing) => {
        return (
          listing.title.toLowerCase().includes(cleanQuery) ||
          listing.category.toLowerCase().includes(cleanQuery) ||
          listing.location.toLowerCase().includes(cleanQuery)
        )
      })
    }

    return next
  }, [query, saved, view])

  function toggleSaved(id: string) {
    setSaved((current) => ({
      ...current,
      [id]: !current[id],
    }))
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

          <button type="button" className="mk-filter-button">
            Filter
          </button>
        </div>

        <div
          className="mk-view-switch"
          role="tablist"
          aria-label="Marketplace view"
        >
          <button
            type="button"
            className={`mk-view-option ${
              view === "for-you" ? "is-active" : ""
            }`}
            onClick={() => setView("for-you")}
            role="tab"
            aria-selected={view === "for-you"}
          >
            For You
          </button>

          <button
            type="button"
            className={`mk-view-option ${
              view === "nearby" ? "is-active" : ""
            }`}
            onClick={() => setView("nearby")}
            role="tab"
            aria-selected={view === "nearby"}
          >
            Nearby
          </button>

          <button
            type="button"
            className={`mk-view-option ${
              view === "bundles" ? "is-active" : ""
            }`}
            onClick={() => setView("bundles")}
            role="tab"
            aria-selected={view === "bundles"}
          >
            Bundles
          </button>

          <button
            type="button"
            className={`mk-view-option ${
              view === "saved" ? "is-active" : ""
            }`}
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
        {eventTypes.map((type) => (
          <button key={type} type="button" className="mk-event-chip">
            {type}
          </button>
        ))}
      </section>

      <section className="mk-feed" aria-label="Marketplace listings">
        {filteredListings.length > 0 ? (
          filteredListings.map((listing) => (
            <article key={listing.id} className="mk-card">
              <Link href={`/listing/${listing.id}`} className="mk-card-link">
                <div className="mk-card-media">
                  <Image
                    src={listing.imageUrl}
                    alt={listing.title}
                    fill
                    sizes="(max-width: 760px) 100vw, 33vw"
                    className="mk-card-image"
                    priority={listing.id === "1"}
                  />

                  <div className="mk-card-image-wash" />

                  {listing.badge ? (
                    <span className="mk-card-badge">{listing.badge}</span>
                  ) : null}
                </div>

                <div className="mk-card-body">
                  <div>
                    <p className="mk-card-category">{listing.category}</p>
                    <h2>{listing.title}</h2>
                  </div>

                  <div className="mk-card-meta">
                    <strong>${listing.price}</strong>
                    <span>
                      {listing.location} · {listing.condition}
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

        <Link href="/messages" className="mk-bottom-link">
          Messages
        </Link>

        <Link href="/profile" className="mk-bottom-link">
          Profile
        </Link>
      </nav>
    </main>
  )
}