"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/app/lib/supabase/client"
import styles from "../seller-orders.module.css"

type ListingImageRow = {
  image_url: string
  is_primary: boolean
  sort_order: number
}

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
        price: number
        listing_images: ListingImageRow[] | null
      }
    | {
        title: string
        price: number
        listing_images: ListingImageRow[] | null
      }[]
    | null
}

type ProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
}

type ConversationRow = {
  id: string
  order_id: string | null
}

function getListing(order: OrderRow) {
  if (Array.isArray(order.listings)) {
    return order.listings[0] || null
  }

  return order.listings || null
}

function getPrimaryImage(order: OrderRow) {
  const listing = getListing(order)
  const images = listing?.listing_images || []

  return [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.sort_order - b.sort_order
  })[0]?.image_url
}

function getProfileName(profile: ProfileRow | null) {
  if (!profile) return "Buyer"

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ")

  return name || profile.full_name || "Buyer"
}

function buildConfirmationNumber(orderId: string) {
  const clean = orderId.replace(/-/g, "").toUpperCase()
  return `DE-${clean.slice(0, 4)}-${clean.slice(-6)}`
}

function formatDate(value: string) {
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
    completed: "Completed",
  }

  return labels[value] || value
}

export default function SellerOrderDetailPage() {
  const params = useParams()
  const supabase = useMemo(() => createClient(), [])

  const orderId = Array.isArray(params.orderId)
    ? params.orderId[0]
    : params.orderId

  const [order, setOrder] = useState<OrderRow | null>(null)
  const [buyer, setBuyer] = useState<ProfileRow | null>(null)
  const [conversationId, setConversationId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    async function loadSaleDetails() {
      if (!orderId) return

      setLoading(true)
      setError("")

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Please sign in to view this sale.")
        setLoading(false)
        return
      }

      const { data: orderData, error: orderError } = await supabase
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
            title,
            price,
            listing_images (
              image_url,
              is_primary,
              sort_order
            )
          )
        `
        )
        .eq("id", orderId)
        .single()

      if (!mounted) return

      if (orderError || !orderData) {
        setError("Sale not found.")
        setLoading(false)
        return
      }

      const normalizedOrder = orderData as unknown as OrderRow

      if (normalizedOrder.seller_id !== user.id) {
        setError("You do not have access to this sale.")
        setLoading(false)
        return
      }

      const [{ data: buyerProfile }, { data: conversationData }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, first_name, last_name, full_name")
            .eq("id", normalizedOrder.buyer_id)
            .single(),
          supabase
            .from("conversations")
            .select("id, order_id")
            .eq("order_id", normalizedOrder.id)
            .maybeSingle(),
        ])

      if (!mounted) return

      setOrder(normalizedOrder)
      setBuyer((buyerProfile || null) as ProfileRow | null)
      setConversationId((conversationData as ConversationRow | null)?.id || "")
      setLoading(false)
    }

    loadSaleDetails()

    return () => {
      mounted = false
    }
  }, [orderId, supabase])

  if (loading) {
    return (
      <main className={styles.sellerOrdersPage}>
        <section className={styles.stateCard}>
          <h2>Loading sale</h2>
          <p>Getting the order details.</p>
        </section>
      </main>
    )
  }

  if (error || !order) {
    return (
      <main className={styles.sellerOrdersPage}>
        <section className={styles.stateCard}>
          <h2>Sale unavailable</h2>
          <p>{error || "This sale could not be loaded."}</p>
          <Link href="/seller/orders">Back to sales</Link>
        </section>
      </main>
    )
  }

  const listing = getListing(order)
  const imageUrl = getPrimaryImage(order)
  const buyerName = getProfileName(buyer)
  const messageHref = conversationId
    ? `/messages?conversationId=${conversationId}`
    : "/messages"

  return (
    <main className={styles.sellerOrdersPage}>
      <header className={styles.sellerOrdersHeader}>
        <Link href="/seller/orders" className={styles.backLink}>
          Back
        </Link>

        <strong>Decor Encore</strong>

        <Link href={messageHref} className={styles.headerAction}>
          Message
        </Link>
      </header>

      <section className={styles.sellerOrdersShell}>
        <div className={styles.sellerOrdersIntro}>
          <p>Sale details</p>
          <h1>{buildConfirmationNumber(order.id)}</h1>
          <span>
            Use this page to review the sale and coordinate fulfillment with the
            buyer.
          </span>
        </div>

        <article className={styles.orderCard}>
          <div className={styles.orderImage}>
            {imageUrl ? (
              <img src={imageUrl} alt={listing?.title || "Sold item"} />
            ) : (
              <span>D</span>
            )}
          </div>

          <div className={styles.orderContent}>
            <div className={styles.orderTopLine}>
              <span>{formatStatus(order.status)}</span>
              <strong>${Number(order.total || 0).toFixed(2)}</strong>
            </div>

            <h2>{listing?.title || "Decor listing"}</h2>

            <div className={styles.orderDetails}>
              <div>
                <span>Buyer</span>
                <strong>{buyerName}</strong>
              </div>

              <div>
                <span>Sold on</span>
                <strong>{formatDate(order.created_at)}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{formatStatus(order.status)}</strong>
              </div>
            </div>

            <div className={styles.orderActions}>
              <Link href="/seller/orders">All sales</Link>
              <Link href={messageHref}>Message buyer</Link>
            </div>
          </div>
        </article>

        <section className={styles.stateCard}>
          <h2>Fulfillment note</h2>
          <p>
            Coordinate pickup, delivery, and any order questions inside Decor
            Encore messages. Avoid sharing outside contact or payment details.
          </p>
          {/* <Link href={messageHref}>Open conversation</Link> */}
        </section>
      </section>
    </main>
  )
}