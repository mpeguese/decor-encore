// app/admin/forgot-password/AdminForgotPasswordClient.tsx
"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { createClient } from "@/app/lib/supabase/client"
import styles from "../admin.module.css"

export default function AdminForgotPasswordClient() {
  const supabase = useMemo(() => createClient(), [])

  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setMessage("")
    setError("")

    const origin =
      typeof window !== "undefined" ? window.location.origin : ""

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${origin}/admin/reset-password`,
      }
    )

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setMessage(
      "If an active admin account exists for that email, a password reset link has been sent."
    )
  }

  return (
    <main className={styles.authPage}>
      <section className={styles.authCard}>
        <div className={styles.authTop}>
          <strong className={styles.authBrand}>Decor Encore</strong>
          <Link href="/admin/login">Back to login</Link>
        </div>

        <div className={styles.authIntro}>
          <p>Password reset</p>
          <h1>Recover access</h1>
          <span>
            Enter your admin email. If the account is eligible, you will receive
            a secure reset link.
          </span>
        </div>

        <form className={styles.authForm} onSubmit={handleReset}>
          <label className={styles.authField}>
            <span>Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              placeholder="admin@decor-encore.com"
              required
            />
          </label>

          <button className={styles.authButton} type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        {message ? <p className={styles.authMessage}>{message}</p> : null}
        {error ? <p className={styles.authError}>{error}</p> : null}
      </section>
    </main>
  )
}