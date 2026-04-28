// app/onboarding/page.tsx
"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/app/lib/supabase/client"
import styles from "@/app/auth-flow.module.css"

type Intent = "shop" | "sell" | "both"

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [userId, setUserId] = useState("")
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
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
        .select("full_name, phone, zip_code, can_sell")
        .eq("id", user.id)
        .single()

      if (!mounted) return

      setFullName(profile?.full_name || "")
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

    const canSell = intent === "sell" || intent === "both"

    const { error: updateError } = await supabase.from("profiles").upsert({
      id: userId,
      email,
      full_name: fullName.trim(),
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
            <label className={styles.field}>
              <span>Name</span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Full name"
                autoComplete="name"
                required
              />
            </label>

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

              <div className={styles.intentGrid}>
                <button
                  type="button"
                  className={`${styles.intentButton} ${
                    intent === "shop" ? styles.intentActive : ""
                  }`}
                  onClick={() => setIntent("shop")}
                >
                  Shop
                </button>

                <button
                  type="button"
                  className={`${styles.intentButton} ${
                    intent === "sell" ? styles.intentActive : ""
                  }`}
                  onClick={() => setIntent("sell")}
                >
                  Sell
                </button>

                <button
                  type="button"
                  className={`${styles.intentButton} ${
                    intent === "both" ? styles.intentActive : ""
                  }`}
                  onClick={() => setIntent("both")}
                >
                  Both
                </button>
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