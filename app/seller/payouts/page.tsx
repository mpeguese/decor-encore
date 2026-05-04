// app/seller/payouts/page.tsx
"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/app/lib/supabase/client"
import styles from "../orders/seller-orders.module.css"

type PayoutRow = {
  stripe_account_id: string | null
  onboarding_status: string
  charges_enabled: boolean
  payouts_enabled: boolean
  details_submitted: boolean
  requirements_currently_due: string[] | null
}

function getStatusLabel(row: PayoutRow | null) {
  if (!row) return "Not started"
  if (row.charges_enabled && row.payouts_enabled) return "Connected"
  if (row.onboarding_status === "needs_more_info") return "Needs more info"
  if (row.onboarding_status === "restricted") return "Action needed"
  if (row.onboarding_status === "pending_review") return "Pending review"
  if (row.onboarding_status === "onboarding_started") return "In progress"
  return "Not started"
}

function getActionLabel(row: PayoutRow | null) {
  if (!row) return "Set up payouts"
  if (row.charges_enabled && row.payouts_enabled) return "Manage Stripe payouts"
  if (row.onboarding_status === "restricted") return "Finish required payout steps"
  if (row.onboarding_status === "needs_more_info") return "Complete missing payout info"
  if (row.onboarding_status === "pending_review") return "Review Stripe status"
  if (row.onboarding_status === "onboarding_started") return "Continue payout setup"
  return "Set up payouts"
}

export default function SellerPayoutsPage() {
  const supabase = useMemo(() => createClient(), [])

  const [row, setRow] = useState<PayoutRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadPayouts() {
      setLoading(true)
      setError("")

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return

      if (!user) {
        window.location.href = "/login?next=/seller/payouts&reason=payouts"
        return
      }

      const searchParams = new URLSearchParams(window.location.search)
      const stripeReturn = searchParams.get("stripe")

      if (stripeReturn === "return" || stripeReturn === "refresh") {
        const syncResponse = await fetch("/api/stripe/connect/sync")

        if (!syncResponse.ok) {
          const syncData = await syncResponse.json().catch(() => null)
          setError(syncData?.error || "Unable to refresh Stripe payout status.")
        }
      }

      const { data, error: payoutError } = await supabase
        .from("seller_payout_accounts")
        .select(
          "stripe_account_id, onboarding_status, charges_enabled, payouts_enabled, details_submitted, requirements_currently_due"
        )
        .eq("seller_id", user.id)
        .maybeSingle()

      if (!mounted) return

      if (payoutError) {
        setError(payoutError.message)
        setRow(null)
        setLoading(false)
        return
      }

      setRow((data || null) as PayoutRow | null)
      setLoading(false)
    }

    loadPayouts()

    return () => {
      mounted = false
    }
  }, [supabase])

  const status = getStatusLabel(row)
  const actionLabel = getActionLabel(row)
  const requirements = row?.requirements_currently_due || []

  return (
    <main className={styles.sellerOrdersPage}>
      <header className={styles.sellerOrdersHeader}>
        <Link href="/seller" className={styles.backLink}>
          Back
        </Link>

        <strong>Decor Encore</strong>

        <Link href="/messages" className={styles.headerAction}>
          Messages
        </Link>
      </header>

      <section className={styles.sellerOrdersShell}>
        <div className={styles.sellerOrdersIntro}>
          <p>Payouts</p>
          <h1>Setup</h1>
          <span>Connect Stripe to receive payments from your sales.</span>
        </div>

        <section className={styles.stateCard}>
          <h2>{loading ? "Checking payouts" : `Status: ${status}`}</h2>

          {error ? <p>{error}</p> : null}

          {!loading && !error ? (
            requirements.length > 0 ? (
              <p>
                Stripe needs a little more information before payouts are fully
                enabled. Missing: {requirements.join(", ")}.
              </p>
            ) : (
              <p>
                {status === "Connected"
                  ? "Your payout account is connected and ready to receive funds from sales."
                  : "Set up your payout account so Decor Encore can send seller earnings through Stripe."}
              </p>
            )
          ) : null}

          {!loading ? (
            <>
                <div className={styles.payoutActions}>
                <a href="/api/stripe/connect/onboard">{actionLabel}</a>

                <button type="button" onClick={() => setHelpOpen(true)}>
                    Setup help
                </button>
                </div>

                <Link href="/payments" className={styles.payoutPlainLink}>
                    View full payment terms
                </Link>
            </>
            ) : null}
        </section>
      </section>

      {helpOpen ? (
        <div className={styles.payoutHelpOverlay} role="presentation">
          <section
            className={styles.payoutHelpModal}
            role="dialog"
            aria-modal="true"
            aria-label="Payout setup help"
          >
            <div className={styles.payoutHelpHeader}>
              <div>
                <p>Payout setup</p>
                <h2>Before you continue</h2>
              </div>

              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                aria-label="Close payout help"
              >
                ×
              </button>
            </div>

            <div className={styles.payoutHelpList}>
              <div>
                <span>01</span>
                <p>Use your legal name and accurate seller details.</p>
              </div>

              <div>
                <span>02</span>
                <p>
                  Enter a valid phone number. Stripe may require this before the
                  account becomes connected.
                </p>
              </div>

              <div>
                <span>03</span>
                <p>
                  For the website field, use <strong>https://decor-encore.com</strong>.
                </p>
              </div>

              <div>
                <span>04</span>
                <p>
                  In test mode, you can use Stripe test bank details when
                  prompted.
                </p>
              </div>
            </div>

            <Link href="/payments" className={styles.payoutHelpTerms}>
              View full payment terms
            </Link>
          </section>
        </div>
      ) : null}
    </main>
  )
}