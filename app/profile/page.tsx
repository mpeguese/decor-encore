// app/profile/page.tsx
"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/app/lib/supabase/client"
import { getZipCoordinates, normalizeZip } from "@/app/lib/zipCoordinates"
import styles from "@/app/auth-flow.module.css"
import AppBottomNav from "@/app/components/AppBottomNav"

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  const first = parts.shift() || ""
  const last = parts.join(" ")
  return { first, last }
}

type ProfileSnapshot = {
  firstName: string
  lastName: string
  phone: string
  zipCode: string
  canSell: boolean
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

  const [originalProfile, setOriginalProfile] = useState<ProfileSnapshot | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ")

  const currentProfile = useMemo<ProfileSnapshot>(
    () => ({
      firstName,
      lastName,
      phone,
      zipCode,
      canSell,
    }),
    [firstName, lastName, phone, zipCode, canSell]
  )

  const hasChanges = useMemo(() => {
    if (!originalProfile) return false

    return (
      currentProfile.firstName !== originalProfile.firstName ||
      currentProfile.lastName !== originalProfile.lastName ||
      currentProfile.phone !== originalProfile.phone ||
      currentProfile.zipCode !== originalProfile.zipCode ||
      currentProfile.canSell !== originalProfile.canSell
    )
  }, [currentProfile, originalProfile])

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

      const loadedProfile: ProfileSnapshot = {
        firstName: profile?.first_name || fallbackName.first,
        lastName: profile?.last_name || fallbackName.last,
        phone: profile?.phone || "",
        zipCode: profile?.zip_code || "",
        canSell: Boolean(profile?.can_sell),
      }

      setFirstName(loadedProfile.firstName)
      setLastName(loadedProfile.lastName)
      setPhone(loadedProfile.phone)
      setZipCode(loadedProfile.zipCode)
      setCanSell(loadedProfile.canSell)
      setOriginalProfile(loadedProfile)

      setLoading(false)
    }

    loadProfile()

    return () => {
      mounted = false
    }
  }, [router, supabase])

  function handleEditProfile() {
    setError("")
    setMessage("")
    setIsEditing(true)
  }

  function handleCancelEdit() {
    if (!originalProfile) return

    setFirstName(originalProfile.firstName)
    setLastName(originalProfile.lastName)
    setPhone(originalProfile.phone)
    setZipCode(originalProfile.zipCode)
    setCanSell(originalProfile.canSell)

    setError("")
    setMessage("")
    setIsEditing(false)
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!userId || !isEditing || !hasChanges) return

    setSaving(true)
    setError("")
    setMessage("")

    const cleanFirstName = firstName.trim()
    const cleanLastName = lastName.trim()
    const cleanFullName = [cleanFirstName, cleanLastName].filter(Boolean).join(" ")
    const cleanZip = normalizeZip(zipCode)
    const zipCoordinates = cleanZip ? getZipCoordinates(cleanZip) : null

    const { error: updateError } = await supabase.from("profiles").upsert({
      id: userId,
      email,
      first_name: cleanFirstName,
      last_name: cleanLastName,
      full_name: cleanFullName,
      phone: phone.trim(),
      zip_code: cleanZip,
      zip_lat: zipCoordinates?.lat ?? null,
      zip_lng: zipCoordinates?.lng ?? null,
      can_sell: canSell,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    })

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    const savedProfile: ProfileSnapshot = {
      firstName: cleanFirstName,
      lastName: cleanLastName,
      phone: phone.trim(),
      zipCode: cleanZip,
      canSell,
    }

    setFirstName(savedProfile.firstName)
    setLastName(savedProfile.lastName)
    setPhone(savedProfile.phone)
    setZipCode(savedProfile.zipCode)
    setOriginalProfile(savedProfile)
    setIsEditing(false)

    setMessage(
      cleanZip && !zipCoordinates
        ? "Profile updated. ZIP saved, but nearby radius is not available for this ZIP yet."
        : "Profile updated."
    )
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
        <Link href="/orders" className={styles.quickItem}>
          Purchases
        </Link>

        <Link href="/marketplace?view=saved" className={styles.quickItem}>
          Favorites
        </Link>

        <Link href="/seller" className={styles.quickItem}>
          My listings
        </Link>

        <Link href="/seller/orders" className={styles.quickItem}>
          Sales
        </Link>

        <Link href="/messages" className={styles.quickItem}>
          Messages
        </Link>
      </section>

      <form className={styles.profileCard} onSubmit={handleSave}>
        <div className={styles.profileFormHeader}>
          <div>
            <h2>Account details</h2>
            <p>
              {isEditing
                ? "Update the fields below, then save your changes."
                : "View your account details. Select edit to make changes."}
            </p>
          </div>

          {!isEditing ? (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleEditProfile}
            >
              Edit profile
            </button>
          ) : null}
        </div>

        <div className={styles.nameGrid}>
          <label className={styles.field}>
            <span>First</span>
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="First name"
              disabled={!isEditing || saving}
            />
          </label>

          <label className={styles.field}>
            <span>Last</span>
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Last name"
              disabled={!isEditing || saving}
            />
          </label>
        </div>

        <label className={styles.field}>
          <span>Email</span>
          <input value={email} disabled />
          <small>Email is used for login, orders, receipts, and account support.</small>
        </label>

        <label className={styles.field}>
          <span>Phone</span>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Phone number"
            type="tel"
            disabled={!isEditing || saving}
          />
        </label>

        <label className={styles.field}>
          <span>ZIP</span>
          <input
            value={zipCode}
            onChange={(event) => setZipCode(event.target.value)}
            placeholder="ZIP code"
            inputMode="numeric"
            maxLength={10}
            disabled={!isEditing || saving}
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
            disabled={!isEditing || saving}
          />
          
        </label>
        <Link href="/auth/reset-password?from=profile" className={styles.profileHelpLink}>
          Reset password
        </Link>

        {error ? <p className={styles.errorText}>{error}</p> : null}
        {message ? <p className={styles.messageText}>{message}</p> : null}

        {isEditing ? (
          <div className={styles.profileActionRow}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleCancelEdit}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={saving || !hasChanges}
            >
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        ) : null}
      </form>

      

      <AppBottomNav
        active="profile"
        items={[
          {
            key: "shop",
            label: "Shop",
            href: "/marketplace",
          },
          {
            key: "messages",
            label: "Messages",
            href: "/messages",
          },
          {
            key: "profile",
            label: "Profile",
            href: "/profile",
          },
          {
            key: "faq",
            label: "FAQ",
            href: "/faq",
          },
        ]}
      />
    </main>
  )
}