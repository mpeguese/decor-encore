"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/app/lib/supabase/client"
import styles from "./confirmation.module.css"

type OrderRow = {
  id: string
  listing_id: string
  buyer_id: string
  status: string
  total: number
  created_at: string
}

type ListingRow = {
  id: string
  title: string
  pickup_city: string | null
  pickup_state: string | null
}

export default function OrderConfirmationPage() {
  const params = useParams()
  const supabase = useMemo(() => createClient(), [])

  const orderId = Array.isArray(params.orderId)
    ? params.orderId[0]
    : params.orderId

  const [order, setOrder] = useState<OrderRow | null>(null)
  const [listing, setListing] = useState<ListingRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    async function loadConfirmation() {
      if (!orderId) return

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Please sign in to view this order.")
        setLoading(false)
        return
      }

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("id, listing_id, buyer_id, status, total, created_at")
        .eq("id", orderId)
        .single()

      if (!mounted) return

      if (orderError || !orderData) {
        setError("Order not found.")
        setLoading(false)
        return
      }

      const normalizedOrder = orderData as OrderRow

      if (normalizedOrder.buyer_id !== user.id) {
        setError("You do not have access to this order.")
        setLoading(false)
        return
      }

      const { data: listingData } = await supabase
        .from("listings")
        .select("id, title, pickup_city, pickup_state")
        .eq("id", normalizedOrder.listing_id)
        .single()

      if (!mounted) return

      setOrder(normalizedOrder)
      setListing((listingData || null) as ListingRow | null)
      setLoading(false)
    }

    loadConfirmation()

    return () => {
      mounted = false
    }
  }, [orderId, supabase])

  if (loading) {
    return (
      <main className={styles.confirmationPage}>
        <section className={styles.confirmationCard}>
          <h1>Loading confirmation</h1>
          <p>Getting your order details.</p>
        </section>
      </main>
    )
  }

  if (error || !order) {
    return (
      <main className={styles.confirmationPage}>
        <section className={styles.confirmationCard}>
          <h1>Order unavailable</h1>
          <p>{error || "This order could not be loaded."}</p>
          <Link href="/marketplace">Back to marketplace</Link>
        </section>
      </main>
    )
  }

  return (
    <main className={styles.confirmationPage}>
      <section className={styles.confirmationCard}>
        <div className={styles.checkMark}>✓</div>

        <p>Order confirmed</p>
        <h1>Your purchase is complete.</h1>

        <div className={styles.orderSummary}>
          <div>
            <span>Item</span>
            <strong>{listing?.title || "Decor listing"}</strong>
          </div>

          <div>
            <span>Total paid</span>
            <strong>${Number(order.total || 0).toFixed(0)}</strong>
          </div>

          <div>
            <span>Status</span>
            <strong>{order.status}</strong>
          </div>
        </div>

        <div className={styles.actions}>
          <Link href="/marketplace">Keep shopping</Link>
          <Link href="/messages">Messages</Link>
        </div>
      </section>
    </main>
  )
}