// app/seller/page.tsx
"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/app/lib/supabase/client"
import styles from "./seller.module.css"
import AppBottomNav from "@/app/components/AppBottomNav"

type ListingStatus = "draft" | "published" | "paused" | "sold" | "removed"

type SellerListing = {
  id: string
  title: string
  price: number
  status: ListingStatus
  created_at: string
}

type PayoutRow = {
  onboarding_status: string | null
  charges_enabled: boolean | null
  payouts_enabled: boolean | null
}

export default function SellerDashboardPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [sellerName, setSellerName] = useState("")
  const [listings, setListings] = useState<SellerListing[]>([])
  const [payoutRow, setPayoutRow] = useState<PayoutRow | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadSeller() {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return

      if (!user) {
        router.replace("/login?next=/seller")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, full_name, can_sell")
        .eq("id", user.id)
        .single()

      if (!mounted) return

      setSellerName(profile?.first_name || profile?.full_name || "Seller")

      if (!profile?.can_sell) {
        await supabase
          .from("profiles")
          .update({
            can_sell: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)
      }

      const { data } = await supabase
        .from("listings")
        .select("id, title, price, status, created_at")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false })


      if (!mounted) return

      setListings((data || []) as SellerListing[])

      const { data: payoutData } = await supabase
        .from("seller_payout_accounts")
        .select("onboarding_status, charges_enabled, payouts_enabled")
        .eq("seller_id", user.id)
        .maybeSingle()

      if (!mounted) return

      setPayoutRow((payoutData || null) as PayoutRow | null)

      setLoading(false)
    }

    loadSeller()

    return () => {
      mounted = false
    }
  }, [router, supabase])

  const publishedCount = listings.filter((item) => item.status === "published").length
  const draftCount = listings.filter((item) => item.status === "draft").length
  const pausedCount = listings.filter((item) => item.status === "paused").length
  const soldCount = listings.filter((item) => item.status === "sold").length

  const payoutsConnected =
    Boolean(payoutRow?.charges_enabled) && Boolean(payoutRow?.payouts_enabled)

  const payoutStatusLabel = payoutsConnected
    ? "Connected"
    : payoutRow?.onboarding_status === "pending_review"
      ? "Pending review"
      : payoutRow?.onboarding_status === "needs_more_info"
        ? "Needs more info"
        : payoutRow?.onboarding_status === "restricted"
          ? "Action needed"
          : payoutRow?.onboarding_status === "onboarding_started"
            ? "In progress"
            : "Not started"

  if (loading) {
    return (
      <main className={styles.sellerPage}>
        <section className={styles.loadingCard}>Loading...</section>
      </main>
    )
  }

  return (
    <main className={styles.sellerPage}>
      <header className={styles.sellerTopbar}>
        <Link href="/marketplace" className={styles.sellerBrand}>
          <span>D</span>
          <strong>Decor Encore</strong>
        </Link>

        <Link href="/profile" className={styles.sellerProfile}>
          Profile
        </Link>
      </header>

      <section className={styles.sellerHero}>
        <div>
          <p>Seller</p>
          <h1>Hi, {sellerName}.</h1>
        </div>

        <Link href="/seller/listings/new" className={styles.createButton}>
          Create
        </Link>
      </section>

      {!payoutsConnected ? (
      <section className={styles.payoutWarningCard}>
        <div>
          <p>Payout setup required</p>
          <h2>Your listings cannot be purchased yet.</h2>
          <span>
            Buyers can browse and message you, but checkout stays unavailable until
            your Stripe payout setup is complete.
          </span>
        </div>

        <Link href="/seller/payouts">Set up payouts</Link>
      </section>
    ) : null}

      <section className={styles.statsGrid}>
        <article>
          <span>{publishedCount}</span>
          <p>Active</p>
        </article>

        <article>
          <span>{draftCount}</span>
          <p>Drafts</p>
        </article>

        <article>
          <span>{pausedCount}</span>
          <p>Paused</p>
        </article>

        <Link href="/seller/orders" className={styles.statLinkCard}>
          <span>{soldCount}</span>
          <p>Sold</p>
        </Link>
      </section>

      <section className={styles.sellerPanel}>
        <div className={styles.panelHeader}>
          <h2>Listings</h2>
          <Link href="/seller/listings/new">New</Link>
        </div>

        {listings.length > 0 ? (
          <div className={styles.listingStack}>
            {listings.map((listing) => (
              <article key={listing.id} className={styles.listingRow}>
                <div>
                  <h3>{listing.title}</h3>
                  <p>${Number(listing.price).toFixed(2)}</p>
                </div>

                <div className={styles.listingRowActions}>
                  <span className={styles.statusBadge}>{listing.status}</span>
                  <Link href={`/seller/listings/${listing.id}/edit`}>Edit</Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h3>No listings yet</h3>
            <p>Add your first piece of event decor.</p>
            <Link href="/seller/listings/new">Create listing</Link>
          </div>
        )}
      </section>

      {payoutsConnected ? (
        <section className={styles.payoutCard}>
          <div>
            <h2>Payout setup</h2>
            <p>Your Stripe payout account is connected and ready.</p>
          </div>

          <Link href="/seller/payouts" className={styles.payoutLink}>
            Manage
          </Link>
        </section>
      ) : null}

      <AppBottomNav
        active="sell"
        items={[
          {
            key: "sell",
            label: "Seller",
            href: "/seller",
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