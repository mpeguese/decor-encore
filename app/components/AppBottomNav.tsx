// app/components/AppBottomNav.tsx
"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import { createClient } from "@/app/lib/supabase/client"
import styles from "./app-bottom-nav.module.css"

type NavKey =
  | "shop"
  | "nearby"
  | "sell"
  | "messages"
  | "profile"
  | "orders"
  | "support"
  | "faq"

type AppBottomNavItem = {
  key: NavKey
  label: string
  href: string
  variant?: "default" | "sell"
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void
}

type AppBottomNavProps = {
  active?: NavKey
  items?: AppBottomNavItem[]
}

const defaultItems: AppBottomNavItem[] = [
  {
    key: "shop",
    label: "Shop",
    href: "/marketplace",
  },
  {
    key: "nearby",
    label: "Nearby",
    href: "/marketplace?view=nearby",
  },
  {
    key: "sell",
    label: "Sell",
    href: "/seller/listings/new",
    variant: "sell",
  },
  {
    key: "messages",
    label: "Messages",
    href: "/messages",
  },
  {
    key: "faq",
    label: "FAQ",
    href: "/faq",
  },
  {
    key: "profile",
    label: "Profile",
    href: "/profile",
  },
]

function hasActivePath(pathname: string, target: NavKey) {
  if (target === "shop") return pathname === "/marketplace"
  if (target === "nearby") return false
  if (target === "sell") return pathname.startsWith("/seller")
  if (target === "messages") return pathname.startsWith("/messages")
  if (target === "profile") return pathname.startsWith("/profile")
  if (target === "orders") return pathname.startsWith("/orders")
  if (target === "support") return pathname.startsWith("/support")
  if (target === "faq") return pathname.startsWith("/faq")
  return false
}

export default function AppBottomNav({
  active,
  items = defaultItems,
}: AppBottomNavProps) {
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

    window.addEventListener("decor-encore:messages-read", loadUnreadMessages)

    return () => {
      mounted = false
      window.removeEventListener("decor-encore:messages-read", loadUnreadMessages)
    }
  }, [supabase, pathname])

  return (
    <nav 
      className={styles.appBottomNav} 
      aria-label="Primary navigation"
      style={{ "--nav-count": items.length } as React.CSSProperties}
    >
      {items.map((item) => {
        const isSellVariant = item.variant === "sell"
        const isActive = active ? active === item.key : hasActivePath(pathname, item.key)

        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={item.onClick}
            className={`${styles.navLink} ${
              isSellVariant ? styles.sellLink : ""
            } ${
              isActive
                ? isSellVariant
                  ? styles.sellActive
                  : styles.active
                : ""
            }`}
          >
            {item.key === "messages" ? (
              <span className={styles.labelWithDot}>
                {item.label}
                {hasUnreadMessages ? <span className={styles.unreadDot} /> : null}
              </span>
            ) : (
              item.label
            )}
          </Link>
        )
      })}
    </nav>
  )
}