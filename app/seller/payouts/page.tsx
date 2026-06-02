// app/seller/payouts/page.tsx
"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/app/lib/supabase/client"
import styles from "../orders/seller-orders.module.css"
import AppBottomNav from "@/app/components/AppBottomNav"

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
  if (!row) return "Set up Stripe payouts"
  if (row.charges_enabled && row.payouts_enabled) return "Manage Stripe payouts"
  if (row.onboarding_status === "restricted") return "Finish required payout steps"
  if (row.onboarding_status === "needs_more_info") return "Complete missing payout info"
  if (row.onboarding_status === "pending_review") return "Review Stripe status"
  if (row.onboarding_status === "onboarding_started") return "Continue payout setup"
  return "Set up Stripe payouts"
}

export default function SellerPayoutsPage() {
  const supabase = useMemo(() => createClient(), [])

  const [row, setRow] = useState<PayoutRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [helpOpen, setHelpOpen] = useState(false)
  const [redirectingToStripe, setRedirectingToStripe] = useState(false)

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
            <p>
              {status === "Connected"
                ? "Your payout account is connected and ready to receive funds from sales."
                : status === "Pending review"
                  ? "Stripe is reviewing your payout setup. You can keep managing listings, but purchases may stay unavailable until review is complete."
                  : status === "Action needed"
                    ? "Stripe needs an update before your listings can be purchased. Review the instructions, then continue to Stripe to finish the required steps."
                    : status === "Needs more info" || requirements.length > 0
                      ? "Stripe needs a little more information before buyers can purchase your listings. Review the instructions, then continue to Stripe to complete the missing payout details."
                      : "Review the payout setup instructions first, then continue to Stripe so buyers can purchase your listings and Decor Encore can send your seller earnings."}
            </p>
          ) : null}

          {!loading ? (
            <>
              <div className={styles.payoutActions}>
  <button type="button" onClick={() => setHelpOpen(true)}>
    Quick Help
  </button>

  <a
    href="/api/stripe/connect/onboard"
    aria-busy={redirectingToStripe}
    onClick={() => setRedirectingToStripe(true)}
  >
    {redirectingToStripe ? (
      <>
        <span className={styles.buttonSpinner} aria-hidden="true" />
        Redirecting to Stripe...
      </>
    ) : (
      actionLabel
    )}
  </a>
</div>

<div className={styles.payoutSupportLinks}>
  <Link href="/payments/stripe-101">Stripe 101</Link>
  <span aria-hidden="true">|</span>
  <Link href="/payments">T&amp;Cs</Link>
</div>
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
            aria-label="Payout setup instructions"
          >
            <div className={styles.payoutHelpHeader}>
              <div>
                <p>Payout setup</p>
                <h2>Before you continue</h2>
              </div>

              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                aria-label="Close payout setup instructions"
              >
                ×
              </button>
            </div>

            <div className={styles.payoutHelpList}>
              <div>
                <span>01</span>
                <p>
                  Enter a valid email address you can access. Stripe may use this
                  for verification and payout updates.
                </p>
              </div>

              <div>
                <span>02</span>
                <p>
                  Enter a valid phone number. Stripe may require phone
                  verification before your payout account becomes connected.
                </p>
              </div>

              <div>
                <span>03</span>
                <p>
                  Select the business type that best matches how you are selling.
                  Most individual sellers should choose <strong>Individual</strong>.
                </p>
              </div>

              <div>
                <span>04</span>
                <p>
                  Enter accurate legal and identity information. This must match
                  your official identification and banking details.
                </p>
              </div>

              <div>
                <span>05</span>
                <p>
                  For industry, select <strong>Retail</strong>, then choose{" "}
                  <strong>Other merchandise</strong> or the closest available
                  option.
                </p>
              </div>

              <div>
                <span>06</span>
                <p>
                  For the website field, use{" "}
                  <strong>https://decor-encore.com</strong>.
                </p>
              </div>

              <div>
                <span>07</span>
                <p>
                  Enter the bank account where you want seller payouts sent after
                  you make a sale.
                </p>
              </div>

              <Link href="/payments" className={styles.payoutHelpTerms}>
                View full payment terms
              </Link>
            </div>
          </section>
        </div>
      ) : null}

      <AppBottomNav
        active="shop"
        items={[
          {
            key: "shop",
            label: "Shop",
            href: "/marketplace",
          },
          {
            key: "sell",
            label: "Seller",
            href: "/seller",
          },
          {
            key: "profile",
            label: "Profile",
            href: "/profile",
          },
        ]}
      />
    </main>
  )
}