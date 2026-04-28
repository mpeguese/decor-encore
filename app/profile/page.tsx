// app/profile/page.tsx
"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/app/lib/supabase/client"
import styles from "@/app/auth-flow.module.css"

export default function ProfilePage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [userId, setUserId] = useState("")
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [canSell, setCanSell] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

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
        .select("full_name, phone, zip_code, can_sell")
        .eq("id", user.id)
        .single()

      if (!mounted) return

      setFullName(profile?.full_name || "")
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
          {fullName.trim() ? fullName.trim().charAt(0).toUpperCase() : "M"}
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
        <label className={styles.field}>
          <span>Name</span>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Full name"
          />
        </label>

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

      <nav className={styles.appBottomNav} aria-label="Primary navigation">
        <Link href="/marketplace">Shop</Link>
        <Link href="/marketplace?view=nearby">Nearby</Link>
        <Link href="/seller/listings/new" className={styles.bottomSell}>
          Sell
        </Link>
        <Link href="/messages">Messages</Link>
        <Link href="/profile" className={styles.bottomActive}>
          Profile
        </Link>
      </nav>
    </main>
  )
}