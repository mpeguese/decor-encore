// app/messages/page.tsx
import { Suspense } from "react"
import MessagesClient from "./MessagesClient"

function MessagesFallback() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--blush)",
      }}
    />
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<MessagesFallback />}>
      <MessagesClient />
    </Suspense>
  )
}