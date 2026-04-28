"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { FormEvent, useMemo, useState } from "react"
import { createClient } from "@/app/lib/supabase/client"
import styles from "@/app/auth-flow.module.css"

type AuthMode = "signin" | "signup"

export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])

  const next = searchParams.get("next") || "/marketplace"

  const [mode, setMode] = useState<AuthMode>("signin")
  const [fullName, setFullName] = useState("")
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
    const cleanName = fullName.trim()

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
            full_name: cleanName,
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
          full_name: cleanName,
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
                  {showPassword ? "Hide" : "Show"}
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