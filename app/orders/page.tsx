// app/orders/page.tsx
"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/app/lib/supabase/client"
import styles from "@/app/seller/orders/seller-orders.module.css"
import AppBottomNav from "@/app/components/AppBottomNav"

type ListingImageRow = {
  image_url: string
  is_primary: boolean
  sort_order: number
}

type ListingRow =
  | {
      title: string
      listing_images: ListingImageRow[] | null
    }
  | {
      title: string
      listing_images: ListingImageRow[] | null
    }[]
  | null

type OrderRow = {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  status: string
  fulfillment_method: string | null
  total: number
  created_at: string
  listings: ListingRow
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
  listing_id: string
  buyer_id: string
  seller_id: string
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

function getProfileName(profile: ProfileRow | undefined) {
  if (!profile) return "Seller"

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ")

  return name || profile.full_name || "Seller"
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function formatStatus(value: string, fulfillmentMethod?: string | null) {
  if (value === "arranged" && fulfillmentMethod === "shipping") {
    return "Shipped"
  }

  if (value === "arranged") {
    return "Pickup arranged"
  }

  const labels: Record<string, string> = {
    pending: "Pending",
    paid: "Paid",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
    refunded: "Refunded",
    disputed: "Disputed",
  }

  return labels[value] || value
}

function buildConfirmationNumber(orderId: string) {
  const clean = orderId.replace(/-/g, "").toUpperCase()
  return `DE-${clean.slice(0, 4)}-${clean.slice(-6)}`
}

export default function OrdersPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [orders, setOrders] = useState<OrderRow[]>([])
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({})
  const [conversationsByOrder, setConversationsByOrder] = useState<
    Record<string, string>
  >({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    async function loadBuyerOrders() {
      setLoading(true)
      setError("")

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return

      if (!user) {
        router.replace("/login?next=/orders")
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
          fulfillment_method,
          total,
          created_at,
          listings (
            title,
            listing_images (
              image_url,
              is_primary,
              sort_order
            )
          )
        `
        )
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false })

      if (!mounted) return

      if (ordersError) {
        setOrders([])
        setError(ordersError.message)
        setLoading(false)
        return
      }

      const nextOrders = (data || []) as unknown as OrderRow[]
      setOrders(nextOrders)

      const sellerIds = Array.from(
        new Set(nextOrders.map((order) => order.seller_id).filter(Boolean))
      )

      if (sellerIds.length > 0) {
        const { data: profileRows } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, full_name")
          .in("id", sellerIds)

        if (mounted) {
          const profileMap: Record<string, ProfileRow> = {}

          ;((profileRows || []) as ProfileRow[]).forEach((profile) => {
            profileMap[profile.id] = profile
          })

          setProfiles(profileMap)
        }
      }

      const orderIds = nextOrders.map((order) => order.id)

      if (orderIds.length > 0) {
        const { data: conversationRows } = await supabase
          .from("conversations")
          .select("id, order_id, listing_id, buyer_id, seller_id")
          .in("order_id", orderIds)

        if (mounted) {
          const conversationMap: Record<string, string> = {}

          ;((conversationRows || []) as ConversationRow[]).forEach(
            (conversation) => {
              if (conversation.order_id) {
                conversationMap[conversation.order_id] = conversation.id
              }
            }
          )

          setConversationsByOrder(conversationMap)
        }
      }

      setLoading(false)
    }

    loadBuyerOrders()

    return () => {
      mounted = false
    }
  }, [router, supabase])

  return (
    <main className={styles.sellerOrdersPage}>
      <header className={styles.sellerOrdersHeader}>
        <Link href="/profile" className={styles.backLink}>
          Back
        </Link>

        <strong>Decor Encore</strong>

        <Link href="/messages" className={styles.headerAction}>
          Messages
        </Link>
      </header>

      <section className={styles.sellerOrdersShell}>
        <div className={styles.sellerOrdersIntro}>
          <p>Your orders</p>
          <h1>Purchases</h1>
          <span>Track what you bought, seller details, and order help.</span>
        </div>

        {loading ? (
          <section className={styles.stateCard}>
            <h2>Loading purchases</h2>
            <p>Getting your latest orders.</p>
          </section>
        ) : null}

        {!loading && error ? (
          <section className={styles.stateCard}>
            <h2>Orders unavailable</h2>
            <p>{error}</p>
            <Link href="/profile">Back to profile</Link>
          </section>
        ) : null}

        {!loading && !error && orders.length === 0 ? (
          <section className={styles.stateCard}>
            <h2>No purchases yet</h2>
            <p>When you buy once-loved decor, your orders will appear here.</p>
            <Link href="/marketplace">Browse decor</Link>
          </section>
        ) : null}

        {!loading && !error && orders.length > 0 ? (
          <div className={styles.ordersList}>
            {orders.map((order) => {
              const listing = getListing(order)
              const imageUrl = getPrimaryImage(order)
              const sellerName = getProfileName(profiles[order.seller_id])
              const conversationId = conversationsByOrder[order.id]
              const messageHref = conversationId
                ? `/messages?conversationId=${conversationId}`
                : "/messages"

              return (
                <article key={order.id} className={styles.orderCard}>
                  <div className={styles.orderImage}>
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={listing?.title || "Purchased item"}
                      />
                    ) : (
                      <span>D</span>
                    )}
                  </div>

                  <div className={styles.orderContent}>
                    <div className={styles.orderTopLine}>
                      <span>{buildConfirmationNumber(order.id)}</span>
                      <strong>${Number(order.total || 0).toFixed(2)}</strong>
                    </div>

                    <h2>{listing?.title || "Decor listing"}</h2>

                    <div className={styles.orderDetails}>
                      <div>
                        <span>Seller</span>
                        <strong>{sellerName}</strong>
                      </div>

                      <div>
                        <span>Date</span>
                        <strong>{formatDate(order.created_at)}</strong>
                      </div>

                      <div>
                        <span>Status</span>
                        <strong>{formatStatus(order.status, order.fulfillment_method)}</strong>
                      </div>
                    </div>

                    <div className={styles.orderActions}>
                      <Link href={`/orders/${order.id}/confirmation`}>
                        View Details
                      </Link>

                      <Link href={messageHref} className={styles.orderActionPrimary}>
                        Message Seller
                      </Link>

                      <Link href={`/support/order?orderId=${order.id}`}>
                        Need Help
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : null}
      </section>

      {/* <AppBottomNav active="orders" /> */}
      <AppBottomNav
        active="orders"
        items={[
          {
            key: "shop",
            label: "Shop",
            href: "/marketplace",
          },
          {
            key: "orders",
            label: "Orders",
            href: "/orders",
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
          // {
          //   key: "support",
          //   label: "Support",
          //   href: "/support",
          // },
        ]}
      />
    </main>
  )
}