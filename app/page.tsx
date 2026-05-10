// app/page.tsx
"use client"

import Link from "next/link"
import { useMemo, useState, useEffect } from "react"

type Intent = "shop" | "sell"

const featuredSearches = ["Backdrops", "Florals", "Table decor", "Bundles"]



export default function HomePage() {
  const [intent, setIntent] = useState<Intent>("shop")

  const continueHref = useMemo(() => {
    return intent === "shop" ? "/marketplace" : "/seller/listings/new"
  }, [intent])

  const isLargeScreen = useIsLargeScreen()

  const heroVideoSrc =
    isLargeScreen === true
      ? "/videos/decor-hero-desktop.mp4"
      : "/videos/decor-hero.mp4"

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

  <Link href="/login" className="de-signin">
    Sign in
  </Link>
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

            {/* <h1>The next moment starts here.</h1> */}

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
          </div>
        </div>
      </section>

      <section className="de-story-section">
        <p className="de-section-kicker">How it works</p>

        <div className="de-story-grid">
          <div className="de-story-card">
            <span>01</span>
            <h2>Discover pieces with a past</h2>
            <p>Every celebration starts with a feeling. Browse once-loved event decor that has already been part of someone’s beautiful moment — and is ready to bring yours to life.</p>
          </div>

          <div className="de-story-card">
            <span>02</span>
            <h2>Bring your vision to life</h2>
            <p>Create a polished look by combining pieces you love — without buying everything new or figuring it all out from scratch.</p>
          </div>

          <div className="de-story-card">
            <span>03</span>
            <h2>Let the story continue</h2>
            <p>When the day has passed, give your decor another chapter by listing it here <b><u>first</u></b>. Inspire someone planning their own unforgettable moment.</p>
          </div>
        </div>
      </section>

    </main>
  )
}