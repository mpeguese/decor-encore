"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/app/lib/supabase/client"
import styles from "./messages.module.css"
import AppBottomNav from "@/app/components/AppBottomNav"
import { containsOffPlatformContact } from "../lib/moderation/offPlatform"

type ConversationRow = {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  updated_at: string
  created_at: string
  listings:
    | {
        id: string
        title: string
        price: number
        listing_images:
          | {
              image_url: string
              is_primary: boolean
              sort_order: number
            }[]
          | null
      }
    | {
        id: string
        title: string
        price: number
        listing_images:
          | {
              image_url: string
              is_primary: boolean
              sort_order: number
            }[]
          | null
      }[]
    | null
}

type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  read_at: string | null
}

type ProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
}

type ViewMode = "list" | "thread"

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 12L20 4l-4 16-3.5-6.5L4 12z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M20 4l-7.5 9.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M15 6l-6 6 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function getListing(conversation: ConversationRow) {
  if (Array.isArray(conversation.listings)) {
    return conversation.listings[0] || null
  }

  return conversation.listings || null
}

function getListingImage(conversation: ConversationRow) {
  const listing = getListing(conversation)
  const images = listing?.listing_images || []

  const sorted = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.sort_order - b.sort_order
  })

  return sorted[0]?.image_url || ""
}

function getProfileName(profile: ProfileRow | undefined) {
  if (!profile) return "Member"

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ")

  return name || profile.full_name || "Member"
}

function formatPrice(value: number) {
  return `$${Number(value || 0).toFixed(0)}`
}

function formatShortDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ""

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

function formatMessageTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ""

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default function MessagesClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])

  const conversationIdFromUrl = searchParams.get("conversationId")

  const [userId, setUserId] = useState("")
  const [conversations, setConversations] = useState<ConversationRow[]>([])
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({})
  const [selectedConversationId, setSelectedConversationId] = useState("")
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [messageText, setMessageText] = useState("")
  const [loading, setLoading] = useState(true)
  const [threadLoading, setThreadLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("list")

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedConversationId) ||
    null

  useEffect(() => {
    let mounted = true

    async function loadConversations() {
      setLoading(true)
      setError("")

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return

      if (!user) {
        router.replace("/login?next=/messages&reason=message")
        return
      }

      setUserId(user.id)

      const { data, error: conversationError } = await supabase
        .from("conversations")
        .select(
          `
          id,
          listing_id,
          buyer_id,
          seller_id,
          updated_at,
          created_at,
          listings (
            id,
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
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("updated_at", { ascending: false })

      if (!mounted) return

      if (conversationError) {
        setError(conversationError.message)
        setConversations([])
        setLoading(false)
        return
      }

      const nextConversations = (data || []) as unknown as ConversationRow[]
      setConversations(nextConversations)

      const profileIds = Array.from(
        new Set(
          nextConversations.flatMap((conversation) => [
            conversation.buyer_id,
            conversation.seller_id,
          ])
        )
      )

      if (profileIds.length > 0) {
        const { data: profileRows } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, full_name")
          .in("id", profileIds)

        if (mounted) {
          const profileMap: Record<string, ProfileRow> = {}

          ;((profileRows || []) as ProfileRow[]).forEach((profile) => {
            profileMap[profile.id] = profile
          })

          setProfiles(profileMap)
        }
      }

      const initialConversationId =
        conversationIdFromUrl ||
        nextConversations[0]?.id ||
        ""

      setSelectedConversationId(initialConversationId)

      if (initialConversationId) {
        setViewMode("thread")
      }

      setLoading(false)
    }

    loadConversations()

    return () => {
      mounted = false
    }
  }, [conversationIdFromUrl, router, supabase])

  useEffect(() => {
    let mounted = true

    async function loadMessages() {
      if (!selectedConversationId) {
        setMessages([])
        return
      }

      setThreadLoading(true)

      const { data, error: messageError } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, body, created_at, read_at")
        .eq("conversation_id", selectedConversationId)
        .order("created_at", { ascending: true })

      if (!mounted) return

      if (messageError) {
        setError(messageError.message)
        setMessages([])
      } else {
        setMessages((data || []) as MessageRow[])
      }

      if (userId && selectedConversationId) {
        await supabase
            .from("messages")
            .update({
            read_at: new Date().toISOString(),
            })
            .eq("conversation_id", selectedConversationId)
            .neq("sender_id", userId)
            .is("read_at", null)
        }

      setThreadLoading(false)
    }

    loadMessages()

    return () => {
      mounted = false
    }
  }, [selectedConversationId, supabase])

  function getOtherUserId(conversation: ConversationRow) {
    return conversation.buyer_id === userId
      ? conversation.seller_id
      : conversation.buyer_id
  }

  function selectConversation(conversationId: string) {
    setSelectedConversationId(conversationId)
    setViewMode("thread")

    const params = new URLSearchParams(window.location.search)
    params.set("conversationId", conversationId)
    router.replace(`/messages?${params.toString()}`)
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const body = messageText.trim()

    if (!body) return

    if (containsOffPlatformContact(body)) {
      setError(
        "Please keep communication inside Decor Encore. Contact details and off-platform payment references are not allowed."
      )
      return
    }

    if (!selectedConversation || !userId || sending) return

    setSending(true)
    setError("")

    const optimisticMessage: MessageRow = {
      id: `temp-${Date.now()}`,
      conversation_id: selectedConversation.id,
      sender_id: userId,
      body,
      created_at: new Date().toISOString(),
      read_at: null,
    }

    setMessages((current) => [...current, optimisticMessage])
    setMessageText("")

    const { error: insertError } = await supabase.from("messages").insert({
      conversation_id: selectedConversation.id,
      sender_id: userId,
      body,
    })

    if (insertError) {
      setMessages((current) =>
        current.filter((message) => message.id !== optimisticMessage.id)
      )
      setMessageText(body)
      setError(insertError.message)
      setSending(false)
      return
    }

    await supabase
      .from("conversations")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedConversation.id)

    const { data } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, body, created_at, read_at")
      .eq("conversation_id", selectedConversation.id)
      .order("created_at", { ascending: true })

    setMessages((data || []) as MessageRow[])
    setSending(false)
  }

  return (
    <main className={styles.messagesPage}>
      <header className={styles.messagesTopbar}>
        <Link href="/marketplace" className={styles.brandPill}>
          <span>D</span>
          <strong>Decor Encore</strong>
        </Link>

        <Link href="/profile" className={styles.profilePill}>
          Profile
        </Link>
      </header>

      <section className={styles.messagesHero}>
        <p>Messages</p>
        <h1>Keep the deal moving.</h1>
      </section>

      <section className={styles.messagesShell}>
        <aside
          className={`${styles.conversationPanel} ${
            viewMode === "thread" ? styles.hideOnMobile : ""
          }`}
        >
          {loading ? (
            <div className={styles.stateCard}>
              <h2>Loading</h2>
              <p>Getting your conversations.</p>
            </div>
          ) : error ? (
            <div className={styles.stateCard}>
              <h2>Unable to load</h2>
              <p>{error}</p>
            </div>
          ) : conversations.length > 0 ? (
            <div className={styles.conversationList}>
              {conversations.map((conversation) => {
                const listing = getListing(conversation)
                const imageUrl = getListingImage(conversation)
                const otherUserId = getOtherUserId(conversation)
                const otherName = getProfileName(profiles[otherUserId])

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    className={`${styles.conversationItem} ${
                      selectedConversationId === conversation.id
                        ? styles.activeConversation
                        : ""
                    }`}
                    onClick={() => selectConversation(conversation.id)}
                  >
                    <div className={styles.conversationImage}>
                      {imageUrl ? <img src={imageUrl} alt="" /> : <span>D</span>}
                    </div>

                    <div>
                      <strong>{otherName}</strong>
                      <span>{listing?.title || "Listing"}</span>
                      <small>{formatShortDate(conversation.updated_at)}</small>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className={styles.stateCard}>
              <h2>No messages yet</h2>
              <p>Contact a seller from a listing to start a conversation.</p>
              <Link href="/marketplace">Browse listings</Link>
            </div>
          )}
        </aside>

        <section
          className={`${styles.threadPanel} ${
            viewMode === "list" ? styles.hideThreadOnMobile : ""
          }`}
        >
          {selectedConversation ? (
            <>
              <header className={styles.threadHeader}>
                <button
                  type="button"
                  className={styles.backThreadButton}
                  onClick={() => setViewMode("list")}
                  aria-label="Back to conversations"
                >
                  <BackIcon />
                </button>

                <div className={styles.threadListingImage}>
                  {getListingImage(selectedConversation) ? (
                    <img src={getListingImage(selectedConversation)} alt="" />
                  ) : (
                    <span>D</span>
                  )}
                </div>

                <div>
                  <strong>{getListing(selectedConversation)?.title || "Listing"}</strong>
                  <span>
                    {formatPrice(Number(getListing(selectedConversation)?.price || 0))}
                  </span>
                </div>
              </header>

              <div className={styles.messageStack}>
                {threadLoading ? (
                  <div className={styles.threadState}>Loading messages...</div>
                ) : messages.length > 0 ? (
                  messages.map((message) => {
                    const isMine = message.sender_id === userId

                    return (
                      <article
                        key={message.id}
                        className={`${styles.messageBubble} ${
                          isMine ? styles.myMessage : styles.theirMessage
                        }`}
                      >
                        <p>{message.body}</p>
                        <span>{formatMessageTime(message.created_at)}</span>
                      </article>
                    )
                  })
                ) : (
                  <div className={styles.threadState}>
                    Send the first message.
                  </div>
                )}
              </div>
              {error ? (
  <div className={styles.toastWrap} role="alert">
    <div className={styles.toastError}>{error}</div>
  </div>
) : null}

<form className={styles.messageComposer} onSubmit={handleSend}>
  <input
    value={messageText}
    onChange={(event) => {
      setMessageText(event.target.value)

      if (error) {
        setError("")
      }
    }}
    placeholder="Write a message..."
    aria-label="Message"
  />

  <button type="submit" disabled={sending || !messageText.trim()}>
    <SendIcon />
  </button>
</form>
            </>
          ) : (
            <div className={styles.stateCard}>
              <h2>Select a conversation</h2>
              <p>Your messages will show here.</p>
            </div>
          )}
        </section>
      </section>
        <AppBottomNav active="messages" />
    </main>
  )
}