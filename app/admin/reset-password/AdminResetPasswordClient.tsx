// app/admin/reset-password/AdminResetPasswordClient.tsx
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { createClient } from "@/app/lib/supabase/client"
import styles from "../admin.module.css"

export default function AdminResetPasswordClient() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setMessage("")
    setError("")

    if (password.length < 8) {
      setLoading(false)
      setError("Password must be at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      setLoading(false)
      setError("Passwords do not match.")
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setMessage("Password updated. Redirecting to admin login...")

    window.setTimeout(async () => {
      await supabase.auth.signOut()
      router.replace("/admin/login")
    }, 900)
  }

  return (
    <main className={styles.authPage}>
      <section className={styles.authCard}>
        <div className={styles.authTop}>
          <strong className={styles.authBrand}>Decor Encore</strong>
          <Link href="/admin/login">Admin login</Link>
        </div>

        <div className={styles.authIntro}>
          <p>New password</p>
          <h1>Reset access</h1>
          <span>
            Enter a new password for your admin account. You will sign in again
            after the update.
          </span>
        </div>

        <form className={styles.authForm} onSubmit={handleUpdate}>
          <label className={styles.authField}>
            <span>New password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              required
            />
          </label>

          <label className={styles.authField}>
            <span>Confirm password</span>
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="Repeat new password"
              required
            />
          </label>

          <button className={styles.authButton} type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>

        {message ? <p className={styles.authMessage}>{message}</p> : null}
        {error ? <p className={styles.authError}>{error}</p> : null}
      </section>
    </main>
  )
}