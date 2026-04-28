"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { FormEvent, useMemo, useState } from "react"
import { createClient } from "@/app/lib/supabase/client"
import styles from "@/app/auth-flow.module.css"

type AuthMode = "signin" | "signup"

function EyeIcon({ isVisible }: { isVisible: boolean }) {
  if (isVisible) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M3 3l18 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M9.88 5.1A9.7 9.7 0 0112 4.88c5.5 0 9 5.12 9 7.12a5.8 5.8 0 01-1.42 2.78"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.15 6.52C4.1 7.92 3 10.18 3 12c0 2 3.5 7.12 9 7.12 1.42 0 2.72-.34 3.86-.88"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  )
}

export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])

  const next = searchParams.get("next") || "/marketplace"
  const reason = searchParams.get("reason")

  const [mode, setMode] = useState<AuthMode>("signin")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function routeAfterLogin(userId: string) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", userId)
      .single()

    if (profile?.onboarding_complete) {
      router.push(next)
      router.refresh()
      return
    }

    router.push("/onboarding")
    router.refresh()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setMessage("")
    setError("")

    const cleanEmail = email.trim()
    const cleanFirstName = firstName.trim()
    const cleanLastName = lastName.trim()
    const fullName = [cleanFirstName, cleanLastName].filter(Boolean).join(" ")

    try {
      if (mode === "signin") {
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          })

        if (signInError) {
          setError(signInError.message)
          return
        }

        if (data.user) {
          await routeAfterLogin(data.user.id)
        }

        return
      }

      const redirectTo = `${window.location.origin}/auth/callback?next=/onboarding`

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            first_name: cleanFirstName,
            last_name: cleanLastName,
            full_name: fullName,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (data.user && data.session) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email: cleanEmail,
          first_name: cleanFirstName,
          last_name: cleanLastName,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })

        router.push("/onboarding")
        router.refresh()
        return
      }

      setMessage("Check your email to finish creating your account.")
    } finally {
      setLoading(false)
    }
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
            Browse
          </Link>
        </header>

        <div className={styles.authCard}>
          <div className={styles.authCopy}>
            <p>Decor Encore</p>
            <h1>{mode === "signin" ? "Welcome back." : "Start your encore."}</h1>

            {reason === "favorite" ? (
              <span className={styles.authNotice}>
                Please log in to save favorites!
              </span>
            ) : null}
          </div>

          <div className={styles.authSegment}>
            <button
              type="button"
              className={`${styles.authSegmentOption} ${
                mode === "signin" ? styles.isActive : ""
              }`}
              onClick={() => {
                setMode("signin")
                setError("")
                setMessage("")
              }}
            >
              Sign in
            </button>

            <button
              type="button"
              className={`${styles.authSegmentOption} ${
                mode === "signup" ? styles.isActive : ""
              }`}
              onClick={() => {
                setMode("signup")
                setError("")
                setMessage("")
              }}
            >
              Create
            </button>

            <span
              className={`${styles.authSegmentSlider} ${
                mode === "signup" ? styles.isRight : styles.isLeft
              }`}
            />
          </div>

          <form className={styles.authForm} onSubmit={handleSubmit}>
            {mode === "signup" ? (
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
            ) : null}

            <label className={styles.field}>
              <span>Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
                required
              />
            </label>

            <label className={styles.field}>
              <span>Password</span>
              <div className={styles.passwordShell}>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  minLength={6}
                  required
                />

                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon isVisible={showPassword} />
                </button>
              </div>
            </label>

            {error ? <p className={styles.errorText}>{error}</p> : null}
            {message ? <p className={styles.messageText}>{message}</p> : null}

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={loading}
            >
              {loading
                ? "Working..."
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}