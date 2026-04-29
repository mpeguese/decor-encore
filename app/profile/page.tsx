// app/profile/page.tsx
"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/app/lib/supabase/client"
import styles from "@/app/auth-flow.module.css"
import AppBottomNav from "@/app/components/AppBottomNav"

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  const first = parts.shift() || ""
  const last = parts.join(" ")
  return { first, last }
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [userId, setUserId] = useState("")
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [canSell, setCanSell] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ")

  useEffect(() => {
    let mounted = true

    async function loadProfile() {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return

      if (!user) {
        router.replace("/login?next=/profile")
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
      setCanSell(Boolean(profile?.can_sell))
      setLoading(false)
    }

    loadProfile()

    return () => {
      mounted = false
    }
  }, [router, supabase])

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!userId) return

    setSaving(true)
    setError("")
    setMessage("")

    const cleanFirstName = firstName.trim()
    const cleanLastName = lastName.trim()
    const cleanFullName = [cleanFirstName, cleanLastName].filter(Boolean).join(" ")

    const { error: updateError } = await supabase.from("profiles").upsert({
      id: userId,
      email,
      first_name: cleanFirstName,
      last_name: cleanLastName,
      full_name: cleanFullName,
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

    setMessage("Profile updated.")
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  if (loading) {
    return (
      <main className={styles.profilePage}>
        <section className={styles.loadingCard}>Loading...</section>
      </main>
    )
  }

  return (
    <main className={styles.profilePage}>
      <header className={styles.profileHeader}>
        <Link href="/marketplace" className={styles.brand}>
          <span className={styles.brandMark}>D</span>
          <span>Decor Encore</span>
        </Link>

        <button type="button" className={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </header>

      <section className={styles.profileHero}>
        <div className={styles.profileAvatar}>
          {fullName ? fullName.charAt(0).toUpperCase() : "M"}
        </div>

        <div>
          <p>Profile</p>
          <h1>{fullName || "Your account"}</h1>
          <span>{email}</span>
        </div>
      </section>

      <section className={styles.quickGrid}>
        <Link href="/marketplace?view=saved" className={styles.quickItem}>
          Favorites
        </Link>

        <Link href="/seller" className={styles.quickItem}>
          My listings
        </Link>

        <Link href="/messages" className={styles.quickItem}>
          Messages
        </Link>
      </section>

      <form className={styles.profileCard} onSubmit={handleSave}>
        <div className={styles.nameGrid}>
          <label className={styles.field}>
            <span>First</span>
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="First name"
            />
          </label>

          <label className={styles.field}>
            <span>Last</span>
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Last name"
            />
          </label>
        </div>

        <label className={styles.field}>
          <span>Email</span>
          <input value={email} disabled />
        </label>

        <label className={styles.field}>
          <span>Phone</span>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Phone number"
            type="tel"
          />
        </label>

        <label className={styles.field}>
          <span>ZIP</span>
          <input
            value={zipCode}
            onChange={(event) => setZipCode(event.target.value)}
            placeholder="ZIP code"
            inputMode="numeric"
          />
        </label>

        <label className={styles.sellerToggle}>
          <span>
            <strong>Seller access</strong>
            <small>Enable listing tools</small>
          </span>

          <input
            type="checkbox"
            checked={canSell}
            onChange={(event) => setCanSell(event.target.checked)}
          />
        </label>

        {error ? <p className={styles.errorText}>{error}</p> : null}
        {message ? <p className={styles.messageText}>{message}</p> : null}

        <button type="submit" className={styles.primaryButton} disabled={saving}>
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>

      <AppBottomNav active="profile" />
    </main>
  )
}