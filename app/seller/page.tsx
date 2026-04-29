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

export default function SellerDashboardPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [sellerName, setSellerName] = useState("")
  const [listings, setListings] = useState<SellerListing[]>([])

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

                <span className={styles.statusBadge}>{listing.status}</span>
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

      <section className={styles.payoutCard}>
        <div>
          <h2>Payout setup</h2>
          <p>Stripe Connect will be added after listing flow is working.</p>
        </div>
        <span>Later</span>
      </section>

      <AppBottomNav active="sell" />
    </main>
  )
}