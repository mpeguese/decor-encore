"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/app/lib/supabase/client"
import styles from "./orders.module.css"

type OrderRow = {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  status: string
  total: number
  created_at: string
  listings:
  | {
      title: string
    }
  | {
      title: string
    }[]
  | null
}

function buildConfirmationNumber(orderId: string) {
  const clean = orderId.replace(/-/g, "").toUpperCase()
  return `DE-${clean.slice(0, 4)}-${clean.slice(-6)}`
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function formatStatus(value: string) {
  const labels: Record<string, string> = {
    pending: "Pending",
    paid: "Paid",
    cancelled: "Cancelled",
    refunded: "Refunded",
  }

  return labels[value] || value
}

export default function OrdersPage() {
  const supabase = useMemo(() => createClient(), [])

  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    async function loadOrders() {
      setLoading(true)
      setError("")

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Please sign in to view your orders.")
        setLoading(false)
        return
      }

      const { data, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          id,
          listing_id,
          buyer_id,
          seller_id,
          status,
          total,
          created_at,
          listings (
            title
          )
        `
        )
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false })

      if (!mounted) return

      if (ordersError) {
        setError(ordersError.message)
        setOrders([])
        setLoading(false)
        return
      }

      setOrders((data || []) as OrderRow[])
      setLoading(false)
    }

    loadOrders()

    return () => {
      mounted = false
    }
  }, [supabase])

  return (
    <main className={styles.ordersPage}>
      <header className={styles.ordersHeader}>
        <Link href="/marketplace" className={styles.backLink}>
          Back
        </Link>

        <strong>Decor Encore</strong>
      </header>

      <section className={styles.ordersShell}>
        <div className={styles.ordersIntro}>
          <p>Purchases</p>
          <h1>Your orders</h1>
          <span>Review receipts, confirmation numbers, and purchase status.</span>
        </div>

        {loading ? (
          <section className={styles.stateCard}>
            <h2>Loading orders</h2>
            <p>Getting your purchases.</p>
          </section>
        ) : null}

        {!loading && error ? (
          <section className={styles.stateCard}>
            <h2>Orders unavailable</h2>
            <p>{error}</p>
            <Link href="/login?next=/orders">Sign in</Link>
          </section>
        ) : null}

        {!loading && !error && orders.length === 0 ? (
          <section className={styles.stateCard}>
            <h2>No orders yet</h2>
            <p>Your purchases will appear here after checkout.</p>
            <Link href="/marketplace">Start shopping</Link>
          </section>
        ) : null}

        {!loading && !error && orders.length > 0 ? (
          <div className={styles.ordersList}>
            {orders.map((order) => {
              const listingRecord = Array.isArray(order.listings)
                ? order.listings[0]
                : order.listings

              const title = listingRecord?.title || "Decor listing"
              const statusLabel = formatStatus(order.status)

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}/confirmation`}
                  className={styles.orderRow}
                >
                  <div className={styles.orderMain}>
                    <span>{buildConfirmationNumber(order.id)}</span>
                    <strong>{title}</strong>
                    <p>{formatOrderDate(order.created_at)}</p>
                  </div>

                  <div className={styles.orderMeta}>
                    <strong>${Number(order.total || 0).toFixed(2)}</strong>
                    <span
                      className={`${styles.statusBadge} ${
                        order.status === "paid" ? styles.statusPaid : ""
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : null}
      </section>

      <nav className={styles.ordersBottomBar}>
        <div className={styles.ordersSegment}>
          <Link href="/marketplace" className={styles.ordersOption}>
            Keep shopping
          </Link>

          <Link
            href="/orders"
            className={`${styles.ordersOption} ${styles.ordersPrimary}`}
          >
            Orders
          </Link>

          <Link href="/messages" className={styles.ordersOption}>
            Messages
          </Link>

          <span className={styles.ordersSlider} />
        </div>
      </nav>
    </main>
  )
}