// app/auth/reset-password/page.tsx
"use client"

import { FormEvent, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { createClient } from "@/app/lib/supabase/client"
import styles from "@/app/auth-flow.module.css"

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
          d="M9.88 5.1A9.7 9.7 0 01112 4.88c5.5 0 9 5.12 9 7.12a5.8 5.8 0 01-1.42 2.78"
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

function useIsLargeScreen() {
  const [isLargeScreen, setIsLargeScreen] = useState<boolean | null>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 760px)")

    const updateScreenSize = () => {
      setIsLargeScreen(mediaQuery.matches)
    }

    updateScreenSize()

    mediaQuery.addEventListener("change", updateScreenSize)

    return () => {
      mediaQuery.removeEventListener("change", updateScreenSize)
    }
  }, [])

  return isLargeScreen
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  //const searchParams = useSearchParams()
  //const fromProfile = searchParams.get("from") === "profile"

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [fromProfile, setFromProfile] = useState(false)

  const isLargeScreen = useIsLargeScreen()

  const authVideoSrc =
    isLargeScreen === true
      ? "/videos/decor-hero-desktop.mp4"
      : "/videos/decor-hero.mp4"

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setFromProfile(params.get("from") === "profile")
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setMessage("")
    setError("")

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      setLoading(false)
      return
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setMessage(
        fromProfile
          ? "Your password has been updated. Redirecting back to your profile..."
          : "Your password has been updated. Redirecting to sign in..."
      )

      window.setTimeout(() => {
        router.push(fromProfile ? "/profile" : "/login")
        router.refresh()
      }, 1200)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.authPage}>
      <section className={styles.authMedia} aria-hidden="true">
  {isLargeScreen !== null ? (
    <video
      key={authVideoSrc}
      className={styles.authVideo}
      src={authVideoSrc}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
    />
  ) : null}

  <div className={styles.authVideoWash} />
</section>

      <section className={styles.authShell}>
        <header className={styles.authHeader}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark}>D</span>
            <span>Decor Encore</span>
          </Link>

          <Link href={fromProfile ? "/profile" : "/login"} className={styles.headerLink}>
            {fromProfile ? "Back to Profile" : "Back to Login"}
          </Link>
        </header>

        <div className={styles.authFloatingLogo}>
          <img
            src="/images/decor-encore-logo.png"
            alt="Decor Encore - A Story in Every Piece"
            className={styles.authLogoImage}
          />
        </div>

        <div className={styles.authCard}>
          <div className={styles.authCopy}>
            <p>Decor Encore</p>
            <h1>Reset password.</h1>
          </div>

          <form className={styles.authForm} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>New Password</span>
              <div className={styles.passwordShell}>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="New password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
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

            <label className={styles.field}>
              <span>Confirm Password</span>
              <input
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </label>

            {error ? <p className={styles.errorText}>{error}</p> : null}
            {message ? <p className={styles.messageText}>{message}</p> : null}

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={loading}
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}