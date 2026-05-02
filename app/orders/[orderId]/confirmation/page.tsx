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

function formatOrderTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

export default function OrderConfirmationPage() {
  const params = useParams()
  const supabase = useMemo(() => createClient(), [])

  const orderId = Array.isArray(params.orderId)
    ? params.orderId[0]
    : params.orderId

  const [order, setOrder] = useState<OrderRow | null>(null)
  const [listing, setListing] = useState<ListingRow | null>(null)
  const [buyerEmail, setBuyerEmail] = useState("")
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

      setBuyerEmail(user.email || "")

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
        <section className={styles.receiptShell}>
          <h1>Loading confirmation</h1>
          <p>Getting your order details.</p>
        </section>
      </main>
    )
  }

  if (error || !order) {
    return (
      <main className={styles.confirmationPage}>
        <section className={styles.receiptShell}>
          <h1>Order unavailable</h1>
          <p>{error || "This order could not be loaded."}</p>
          <Link href="/marketplace" className={styles.singleAction}>
            Back to marketplace
          </Link>
        </section>
      </main>
    )
  }

  const confirmationNumber = buildConfirmationNumber(order.id)
  const totalPaid = Number(order.total || 0).toFixed(2)

  return (
    <main className={styles.confirmationPage}>
      <section className={styles.receiptShell}>
        <div className={styles.receiptHeader}>
          <div className={styles.checkMark}>✓</div>

          <p>Order confirmed</p>
          <h1>Receipt</h1>

          <span>
            A confirmation email has been sent to{" "}
            <strong>{buyerEmail || "your account email"}</strong>.
          </span>
        </div>

        <div className={styles.receiptMeta}>
          <div>
            <span>Confirmation</span>
            <strong>{confirmationNumber}</strong>
          </div>

          <div>
            <span>Date</span>
            <strong>
              {formatOrderDate(order.created_at)} · {formatOrderTime(order.created_at)}
            </strong>
          </div>
        </div>

        <div className={styles.receiptDivider} />

        <div className={styles.receiptList}>
          <div className={styles.receiptLine}>
            <div>
              <span>Item</span>
              <strong>{listing?.title || "Decor listing"}</strong>
            </div>
            <p>${totalPaid}</p>
          </div>

          <div className={styles.receiptLine}>
            <div>
              <span>Status</span>
              <strong>{order.status}</strong>
            </div>
            <p>Paid</p>
          </div>

          <div className={styles.receiptLine}>
            <div>
              <span>Payment method</span>
              <strong>Mock card ending in 4242</strong>
            </div>
            <p>Card</p>
          </div>
        </div>

        <div className={styles.receiptDivider} />

        <div className={styles.receiptTotal}>
          <span>Total paid</span>
          <strong>${totalPaid}</strong>
        </div>

        <p className={styles.receiptNote}>
          Keep this confirmation number for your records. You can manage this
          purchase from Orders or message the seller for pickup and fulfillment
          details.
        </p>
      </section>

      <nav className={styles.confirmationBottomBar}>
        <div className={styles.confirmationSegment}>
          <Link href="/marketplace" className={styles.confirmationOption}>
            Keep shopping
          </Link>

          <Link
            href="/orders"
            className={`${styles.confirmationOption} ${styles.confirmationPrimary}`}
          >
            Orders
          </Link>

          <Link href="/messages" className={styles.confirmationOption}>
            Messages
          </Link>

          <span className={styles.confirmationSlider} />
        </div>
      </nav>
    </main>
  )
}