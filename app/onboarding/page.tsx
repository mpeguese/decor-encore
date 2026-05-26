// app/onboarding/page.tsx
"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/app/lib/supabase/client"
import styles from "@/app/auth-flow.module.css"

type Intent = "shop" | "sell" | "both"

const SMS_CONSENT_VERSION = "decor-encore-sms-consent-v1"

const SMS_CONSENT_TEXT =
  "I agree to receive SMS/text message alerts from Decor Encore about my account, listings, purchases, sales, unread messages, pickup or delivery updates, order status, and other important marketplace activity. Message frequency varies. Message and data rates may apply. Reply STOP to opt out and HELP for help. Consent is not required to buy or sell on Decor Encore."

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  const first = parts.shift() || ""
  const last = parts.join(" ")
  return { first, last }
}

function getDigits(value: string) {
  return value.replace(/\D/g, "")
}

function formatPhoneNumber(value: string) {
  const digits = getDigits(value).slice(0, 10)

  if (digits.length <= 3) {
    return digits
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

function normalizePhoneNumber(value: string) {
  return getDigits(value).slice(0, 10)
}

function formatZipCode(value: string) {
  return getDigits(value).slice(0, 5)
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
  const [smsOptIn, setSmsOptIn] = useState(false)
  const [smsOptInAt, setSmsOptInAt] = useState<string | null>(null)
  const [profileHadSmsOptIn, setProfileHadSmsOptIn] = useState(false)
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
        .select(
          `
          first_name,
          last_name,
          full_name,
          phone,
          zip_code,
          can_sell,
          sms_opt_in,
          sms_opt_in_at
        `
        )
        .eq("id", user.id)
        .single()

      if (!mounted) return

      const existingSmsOptIn = Boolean(profile?.sms_opt_in)

      const fallbackName = splitName(profile?.full_name || "")
      setFirstName(profile?.first_name || fallbackName.first)
      setLastName(profile?.last_name || fallbackName.last)
      setPhone(formatPhoneNumber(profile?.phone || ""))
      setZipCode(profile?.zip_code || "")
      setIntent(profile?.can_sell ? "both" : "shop")
      setSmsOptIn(existingSmsOptIn)
      setProfileHadSmsOptIn(existingSmsOptIn)
      setSmsOptInAt(profile?.sms_opt_in_at || null)
      setLoading(false)
    }

    loadUser()

    return () => {
      mounted = false
    }
  }, [router, supabase])

  async function handleSkip() {
    if (!userId || saving) return

    setSaving(true)
    setError("")

    const { error: updateError } = await supabase.from("profiles").upsert({
      id: userId,
      email,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    })

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    router.push("/marketplace")
    router.refresh()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!userId) return

    const cleanFirstName = firstName.trim()
    const cleanLastName = lastName.trim()
    const cleanPhone = normalizePhoneNumber(phone)
    const cleanZipCode = formatZipCode(zipCode)
    const fullName = [cleanFirstName, cleanLastName].filter(Boolean).join(" ")
    const canSell = intent === "sell" || intent === "both"

    if (smsOptIn && !cleanPhone) {
      setError("Enter your phone number to opt in to SMS/text message alerts.")
      return
    }

    if (cleanPhone && cleanPhone.length !== 10) {
      setError("Enter a valid 10-digit phone number.")
      return
    }

    if (cleanZipCode.length !== 5) {
      setError("Enter a valid 5-digit ZIP code.")
      return
    }

    setSaving(true)
    setError("")

    const now = new Date().toISOString()

    const profileUpdates: Record<string, unknown> = {
      id: userId,
      email,
      first_name: cleanFirstName,
      last_name: cleanLastName,
      full_name: fullName,
      phone: cleanPhone,
      zip_code: cleanZipCode,
      can_sell: canSell,
      onboarding_complete: true,
      updated_at: now,
      sms_opt_in: smsOptIn && Boolean(cleanPhone),
    }

    if (smsOptIn && cleanPhone) {
      profileUpdates.sms_opt_in_at = smsOptInAt || now
      profileUpdates.sms_opt_out_at = null
      profileUpdates.sms_opt_in_source = "onboarding"
      profileUpdates.sms_opt_in_version = SMS_CONSENT_VERSION
      profileUpdates.sms_consent_text = SMS_CONSENT_TEXT
      profileUpdates.sms_consent_phone = cleanPhone
    } else if (profileHadSmsOptIn) {
      profileUpdates.sms_opt_in_at = null
      profileUpdates.sms_opt_out_at = now
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .upsert(profileUpdates)

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
    <main className={`${styles.authPage} ${styles.onboardingPage}`}>
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

          <button
            type="button"
            className={styles.headerLink}
            onClick={handleSkip}
            disabled={saving}
          >
            Skip
          </button>
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
                onChange={(event) => setPhone(formatPhoneNumber(event.target.value))}
                placeholder="(813) 555-1234"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={14}
              />
            </label>

            <label className={styles.field}>
              <span>ZIP</span>
              <input
                value={zipCode}
                onChange={(event) => setZipCode(formatZipCode(event.target.value))}
                placeholder="ZIP code"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={5}
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

            <label className={styles.smsConsentBox}>
              <input
                type="checkbox"
                checked={smsOptIn}
                onChange={(event) => setSmsOptIn(event.target.checked)}
              />

              <span>
                <strong>Send me SMS alerts</strong>
                <p className={styles.smsConsentCopy}>
                  I agree to receive SMS/text message alerts from Decor Encore about my account,
                  listings, purchases, sales, unread messages, pickup or delivery updates, order
                  status, and other important marketplace activity. Message frequency varies.
                  Message and data rates may apply. Reply STOP to opt out and HELP for help.
                  Consent is not required to buy or sell on Decor Encore. <br></br><br></br> {" "}See our{" "}
                  <Link href="/terms">T&Cs</Link> and{" "}
                  <Link href="/privacy">Privacy Policy</Link>.
                </p>
              </span>
            </label>

            {/* <p className={styles.onboardingLegalText}>
              By continuing, you agree to Decor Encore’s{" "}
              <Link href="/terms">T&Cs</Link> and{" "}
              <Link href="/privacy">Privacy Policy</Link>.
            </p> */}

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