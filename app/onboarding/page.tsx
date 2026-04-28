// app/onboarding/page.tsx
"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/app/lib/supabase/client"
import styles from "@/app/auth-flow.module.css"

type Intent = "shop" | "sell" | "both"

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  const first = parts.shift() || ""
  const last = parts.join(" ")
  return { first, last }
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [userId, setUserId] = useState("")
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [intent, setIntent] = useState<Intent>("shop")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    async function loadUser() {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return

      if (!user) {
        router.replace("/login?next=/onboarding")
        return
      }

      setUserId(user.id)
      setEmail(user.email || "")

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, full_name, phone, zip_code, can_sell")
        .eq("id", user.id)
        .single()

      if (!mounted) return

      const fallbackName = splitName(profile?.full_name || "")
      setFirstName(profile?.first_name || fallbackName.first)
      setLastName(profile?.last_name || fallbackName.last)
      setPhone(profile?.phone || "")
      setZipCode(profile?.zip_code || "")
      setIntent(profile?.can_sell ? "both" : "shop")
      setLoading(false)
    }

    loadUser()

    return () => {
      mounted = false
    }
  }, [router, supabase])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!userId) return

    setSaving(true)
    setError("")

    const cleanFirstName = firstName.trim()
    const cleanLastName = lastName.trim()
    const fullName = [cleanFirstName, cleanLastName].filter(Boolean).join(" ")
    const canSell = intent === "sell" || intent === "both"

    const { error: updateError } = await supabase.from("profiles").upsert({
      id: userId,
      email,
      first_name: cleanFirstName,
      last_name: cleanLastName,
      full_name: fullName,
      phone: phone.trim(),
      zip_code: zipCode.trim(),
      can_sell: canSell,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    })

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    if (intent === "sell") {
      router.push("/seller")
      router.refresh()
      return
    }

    router.push("/marketplace")
    router.refresh()
  }

  if (loading) {
    return (
      <main className={styles.authPage}>
        <section className={styles.loadingCard}>Loading...</section>
      </main>
    )
  }

  return (
    <main className={styles.authPage}>
      <section className={styles.authMedia} aria-hidden="true">
        <video
          className={styles.authVideo}
          src="/videos/decor-hero.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className={styles.authVideoWash} />
      </section>

      <section className={styles.authShell}>
        <header className={styles.authHeader}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark}>D</span>
            <span>Decor Encore</span>
          </Link>

          <Link href="/marketplace" className={styles.headerLink}>
            Skip
          </Link>
        </header>

        <div className={styles.authCard}>
          <div className={styles.authCopy}>
            <p>Setup</p>
            <h1>Make it yours.</h1>
          </div>

          <form className={styles.authForm} onSubmit={handleSubmit}>
            <div className={styles.nameGrid}>
              <label className={styles.field}>
                <span>First</span>
                <input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="First name"
                  autoComplete="given-name"
                  required
                />
              </label>

              <label className={styles.field}>
                <span>Last</span>
                <input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Last name"
                  autoComplete="family-name"
                  required
                />
              </label>
            </div>

            <label className={styles.field}>
              <span>Phone</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Phone number"
                type="tel"
                autoComplete="tel"
              />
            </label>

            <label className={styles.field}>
              <span>ZIP</span>
              <input
                value={zipCode}
                onChange={(event) => setZipCode(event.target.value)}
                placeholder="ZIP code"
                inputMode="numeric"
                autoComplete="postal-code"
                required
              />
            </label>

            <div className={styles.intentGroup}>
              <span className={styles.intentLabel}>I want to</span>

              <div
                className={styles.intentSwitch}
                role="tablist"
                aria-label="Choose account intent"
              >
                <button
                  type="button"
                  className={`${styles.intentSwitchOption} ${
                    intent === "shop" ? styles.isActive : ""
                  }`}
                  onClick={() => setIntent("shop")}
                  role="tab"
                  aria-selected={intent === "shop"}
                >
                  Shop
                </button>

                <button
                  type="button"
                  className={`${styles.intentSwitchOption} ${
                    intent === "sell" ? styles.isActive : ""
                  }`}
                  onClick={() => setIntent("sell")}
                  role="tab"
                  aria-selected={intent === "sell"}
                >
                  Sell
                </button>

                <button
                  type="button"
                  className={`${styles.intentSwitchOption} ${
                    intent === "both" ? styles.isActive : ""
                  }`}
                  onClick={() => setIntent("both")}
                  role="tab"
                  aria-selected={intent === "both"}
                >
                  Both
                </button>

                <span
                  className={`${styles.intentSwitchSlider} ${
                    intent === "shop"
                      ? styles.intentOne
                      : intent === "sell"
                        ? styles.intentTwo
                        : styles.intentThree
                  }`}
                />
              </div>
            </div>

            {error ? <p className={styles.errorText}>{error}</p> : null}

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={saving}
            >
              {saving ? "Saving..." : "Continue"}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}