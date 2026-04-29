"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import { createClient } from "@/app/lib/supabase/client"
import styles from "./app-bottom-nav.module.css"

type AppBottomNavProps = {
  active?: "shop" | "nearby" | "sell" | "messages" | "profile"
}

function hasActivePath(pathname: string, target: AppBottomNavProps["active"]) {
  if (target === "shop") return pathname === "/marketplace"
  if (target === "sell") return pathname.startsWith("/seller")
  if (target === "messages") return pathname.startsWith("/messages")
  if (target === "profile") return pathname.startsWith("/profile")
  return false
}

export default function AppBottomNav({ active }: AppBottomNavProps) {
  const pathname = usePathname()
  const supabase = useMemo(() => createClient(), [])
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadUnreadMessages() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return

      if (!user) {
        setHasUnreadMessages(false)
        return
      }

      const { data: conversationRows } = await supabase
        .from("conversations")
        .select("id")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)

      if (!mounted) return

      const conversationIds = (conversationRows || []).map((row) => row.id)

      if (conversationIds.length === 0) {
        setHasUnreadMessages(false)
        return
      }

      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", conversationIds)
        .neq("sender_id", user.id)
        .is("read_at", null)

      if (!mounted) return

      setHasUnreadMessages(Boolean(count && count > 0))
    }

    loadUnreadMessages()

    return () => {
      mounted = false
    }
  }, [supabase, pathname])

  const activeItem = active

  return (
    <nav className={styles.appBottomNav} aria-label="Primary navigation">
      <Link
        href="/marketplace"
        className={`${styles.navLink} ${
          activeItem === "shop" || hasActivePath(pathname, "shop")
            ? styles.active
            : ""
        }`}
      >
        Shop
      </Link>

      <Link
        href="/marketplace?view=nearby"
        className={`${styles.navLink} ${activeItem === "nearby" ? styles.active : ""}`}
      >
        Nearby
      </Link>

      <Link
        href="/seller/listings/new"
        className={`${styles.navLink} ${styles.sellLink} ${
          activeItem === "sell" || hasActivePath(pathname, "sell")
            ? styles.sellActive
            : ""
        }`}
      >
        Sell
      </Link>

      <Link
        href="/messages"
        className={`${styles.navLink} ${
          activeItem === "messages" || hasActivePath(pathname, "messages")
            ? styles.active
            : ""
        }`}
      >
        <span className={styles.labelWithDot}>
          Messages
          {hasUnreadMessages ? <span className={styles.unreadDot} /> : null}
        </span>
      </Link>

      <Link
        href="/profile"
        className={`${styles.navLink} ${
          activeItem === "profile" || hasActivePath(pathname, "profile")
            ? styles.active
            : ""
        }`}
      >
        Profile
      </Link>
    </nav>
  )
}