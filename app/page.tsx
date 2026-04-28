// app/page.tsx
"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

type Intent = "shop" | "sell"

const featuredSearches = ["Backdrops", "Florals", "Table decor", "Bundles"]

export default function HomePage() {
  const [intent, setIntent] = useState<Intent>("shop")

  const continueHref = useMemo(() => {
    return intent === "shop" ? "/marketplace" : "/seller/listings/new"
  }, [intent])

  return (
    <main className="de-page">
      <section className="de-hero">
        <div className="de-video-shell" aria-hidden="true">
          <video
            className="de-hero-video"
            src="/videos/decor-hero.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="de-video-wash" />
        </div>

        <header className="de-topbar">
          <Link href="/" className="de-brand" aria-label="Decor Encore home">
            <span className="de-brand-mark">D</span>
            <span className="de-brand-name">Decor Encore</span>
          </Link>

          <Link href="/login" className="de-signin">
            Sign in
          </Link>
        </header>

        <div className="de-hero-content">
          <div className="de-copy">
            <p className="de-kicker">Once-loved decor</p>

            <h1>Ready for its next celebration.</h1>

            <p className="de-subtitle">
              Buy and sell event decor for weddings, showers, quinceañeras,
              birthdays, graduations, holidays, and more.
            </p>
          </div>

          <div className="de-action-panel">
            <div className="de-segment" role="tablist" aria-label="Choose intent">
              <button
                type="button"
                className={`de-segment-option ${intent === "shop" ? "is-active" : ""}`}
                onClick={() => setIntent("shop")}
                role="tab"
                aria-selected={intent === "shop"}
              >
                Shop
              </button>

              <button
                type="button"
                className={`de-segment-option ${intent === "sell" ? "is-active" : ""}`}
                onClick={() => setIntent("sell")}
                role="tab"
                aria-selected={intent === "sell"}
              >
                Sell
              </button>

              <span
                className={`de-segment-slider ${
                  intent === "sell" ? "is-right" : "is-left"
                }`}
              />
            </div>

            <Link href={continueHref} className="de-primary-action">
              {intent === "shop" ? "Start shopping" : "List decor"}
            </Link>

            <div className="de-search-row" aria-label="Popular searches">
              {featuredSearches.map((item) => (
                <Link
                  key={item}
                  href={`/marketplace?search=${encodeURIComponent(item)}`}
                  className="de-mini-link"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <nav className="de-bottom-nav" aria-label="Primary navigation">
          <Link href="/marketplace" className="de-bottom-link">
            <span>Shop</span>
          </Link>

          <Link href="/marketplace?view=nearby" className="de-bottom-link">
            <span>Nearby</span>
          </Link>

          <Link href="/seller/listings/new" className="de-bottom-link de-sell-link">
            <span>Sell</span>
          </Link>

          <Link href="/messages" className="de-bottom-link">
            <span>Messages</span>
          </Link>

          <Link href="/profile" className="de-bottom-link">
            <span>Profile</span>
          </Link>
        </nav>
      </section>

      <section className="de-preview">
        <div className="de-preview-header">
          <p className="de-kicker">Marketplace preview</p>
          <h2>Find the pieces that finish the look.</h2>
        </div>

        <div className="de-feed">
          <Link href="/marketplace?category=backdrops-walls" className="de-feed-card de-feed-card-large">
            <div className="de-card-media de-media-one" />
            <div className="de-card-info">
              <span>Backdrops & Walls</span>
              <strong>Statement pieces for the photo moment.</strong>
            </div>
          </Link>

          <Link href="/marketplace?category=table-decor" className="de-feed-card">
            <div className="de-card-media de-media-two" />
            <div className="de-card-info">
              <span>Table Decor</span>
              <strong>Centerpieces, runners, candles, chargers.</strong>
            </div>
          </Link>

          <Link href="/marketplace?category=bundles" className="de-feed-card">
            <div className="de-card-media de-media-three" />
            <div className="de-card-info">
              <span>Bundles</span>
              <strong>One theme. One pickup. One clean package.</strong>
            </div>
          </Link>
        </div>
      </section>
    </main>
  )
}