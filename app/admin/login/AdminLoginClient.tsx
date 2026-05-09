// app/admin/login/AdminLoginClient.tsx
"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { createClient } from "@/app/lib/supabase/client"
import styles from "../admin.module.css"

function getSafeNext(value: string | null) {
  if (!value) return "/admin"

  return value.startsWith("/admin") ? value : "/admin"
}

export default function AdminLoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])

  const next = getSafeNext(searchParams.get("next"))

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setError("")

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError || !data.user) {
      setLoading(false)
      setError(signInError?.message || "Unable to sign in.")
      return
    }

    const { data: adminAccess, error: adminError } = await supabase
        .from("admin_users")
        .select("id, user_id, role, status, display_name")
        .eq("user_id", data.user.id)
        .eq("status", "active")
        .maybeSingle()

        // console.log("Admin login user id:", data.user.id)
        // console.log("Admin login email:", data.user.email)
        // console.log("Admin access result:", adminAccess)
        // console.log("Admin access error:", adminError)

        if (adminError) {
          await supabase.auth.signOut()
          setLoading(false)
          setError(`Admin access check failed: ${adminError.message}`)
          return
        }

        if (!adminAccess) {
          await supabase.auth.signOut()
          setLoading(false)
          setError("This account does not have active admin access.")
          return
        }

    router.replace(next)
    router.refresh()
  }

  return (
    <main className={styles.authPage}>
      <section className={styles.authCard}>
        <div className={styles.authTop}>
          <strong className={styles.authBrand}>Decor Encore</strong>
          <Link href="/">Public site</Link>
        </div>

        <div className={styles.authIntro}>
          <p>Admin access</p>
          <h1>Sign in</h1>
          <span>
            Use your approved Decor Encore admin account. Buyer and seller
            accounts do not automatically grant admin access.
          </span>
        </div>

        <form className={styles.authForm} onSubmit={handleLogin}>
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

          <label className={styles.authField}>
            <span>Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </label>

          <button className={styles.authButton} type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {error ? <p className={styles.authError}>{error}</p> : null}

        <div className={styles.authLinks}>
          <Link href="/admin/forgot-password">Forgot password?</Link>
        </div>
      </section>
    </main>
  )
}