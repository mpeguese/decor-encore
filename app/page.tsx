// app/page.tsx
"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

type Intent = "shop" | "sell"

const featuredSearches = ["Backdrops", "Florals", "Table decor", "Bundles"]

const INSTAGRAM_URL = "https://www.instagram.com/_decorencore_/"
const TIKTOK_URL = "https://www.tiktok.com/@_decorencore_"

function useIsLargeScreen() {
  const [isLargeScreen, setIsLargeScreen] = useState<boolean | null>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 760px)")

    const updateScreenSize = () => {
      setIsLargeScreen(mediaQuery.matches)
    }

    updateScreenSize()
    mediaQuery.addEventListener("change", updateScreenSize)

    return () => {
      mediaQuery.removeEventListener("change", updateScreenSize)
    }
  }, [])

  return isLargeScreen
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="12"
        r="3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M15.2 4c.35 2.38 1.72 4.06 4.08 4.38v3.08c-1.38.04-2.67-.36-3.9-1.16v5.64c0 3.02-2.08 5.06-5.14 5.06C7.36 21 5.2 18.92 5.2 16.14c0-2.86 2.2-4.94 5.26-4.94.32 0 .62.02.92.08v3.22a3.03 3.03 0 0 0-1-.16c-1.16 0-2.04.76-2.04 1.8 0 1.08.84 1.78 1.98 1.78 1.2 0 1.94-.72 1.94-2.08V4h2.94z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function HomePage() {
  const [intent, setIntent] = useState<Intent>("shop")
  const isLargeScreen = useIsLargeScreen()

  const continueHref = useMemo(() => {
    return intent === "shop" ? "/marketplace" : "/seller/listings/new"
  }, [intent])

  const heroVideoSrc =
    isLargeScreen === true
      ? "/videos/decor-hero-desktop.mp4"
      : "/videos/decor-hero.mp4"

  return (
    <main className="de-page">
      <section className="de-hero">
        <div className="de-video-shell" aria-hidden="true">
          {isLargeScreen !== null ? (
            <video
              key={heroVideoSrc}
              className="de-hero-video"
              src={heroVideoSrc}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : null}

          <div className="de-video-wash" />
        </div>

        <header className="de-topbar">
          <Link href="/" className="de-brand" aria-label="Decor Encore home">
            <span className="de-brand-mark">D</span>
            <span className="de-brand-name">Decor Encore</span>
          </Link>

          <div className="de-header-actions">
            <a
              href={INSTAGRAM_URL}
              className="de-social-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow Decor Encore on Instagram"
            >
              <InstagramIcon />
            </a>

            <a
              href={TIKTOK_URL}
              className="de-social-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow Decor Encore on TikTok"
            >
              <TikTokIcon />
            </a>

            <Link href="/login" className="de-signin de-signin-header">
              Sign in
            </Link>
          </div>
        </header>

        <div className="de-floating-logo">
          <img
            src="/images/decor-encore-logo.png"
            alt="Decor Encore - A Story in Every Piece"
            className="de-hero-logo-image"
          />
        </div>

        <div className="de-hero-content">
          <div className="de-copy">
            <p className="de-kicker">Once-loved decor</p>

            <p className="de-subtitle">
              Buy and sell event decor for weddings, baby showers, quinceañeras,
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

            <Link href="/login" className="de-mobile-signin">
              Already have an account? <span>Sign in</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="de-story-section">
        <p className="de-section-kicker">How it works</p>

        <div className="de-story-grid">
          <div className="de-story-card">
            <span>01</span>
            <h2>Discover pieces with a past</h2>
            <p>
              Every celebration starts with a feeling. Browse once-loved event
              decor that has already been part of someone’s beautiful moment —
              and is ready to bring yours to life.
            </p>
          </div>

          <div className="de-story-card">
            <span>02</span>
            <h2>Bring your vision to life</h2>
            <p>
              Create a polished look by combining pieces you love — without
              buying everything new or figuring it all out from scratch.
            </p>
          </div>

          <div className="de-story-card">
            <span>03</span>
            <h2>Let the story continue</h2>
            <p>
              When the day has passed, give your decor another chapter by
              listing it here <b><u>first</u></b>. Inspire someone planning
              their own unforgettable moment.
            </p>
          </div>
        </div>

        <div
          className="de-story-grid"
          style={{ marginTop: "22px" }}
        >
          {/* <p className="de-section-kicker">How </p> */}
          
          <div className="de-story-card">
            <span>Protection</span>
            <h2>Secure checkout</h2>
            <p>
              Payments stay inside Decor Encore for a smoother experience with
              protected checkout, order tracking, and clear purchase records.
            </p>
          </div>

          <div className="de-story-card">
            <span>Messaging</span>
            <h2>Built-in communication</h2>
            <p>
              Keep conversations connected to the listing and order so buyers
              and sellers can stay organized from first message to final pickup
              or delivery.
            </p>
          </div>

          <div className="de-story-card">
            <span>Support</span>
            <h2>Order history & protection</h2>
            <p>
              View purchases, sales, and order updates in one place with tools
              designed to help both sides feel more confident throughout the
              transaction.
            </p>
          </div>
        </div>
      </section>

      <footer className="de-footer">
        <p>© {new Date().getFullYear()} Decor Encore. All rights reserved.</p>

        <div className="de-footer-links">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </footer>
    </main>
  )
}
