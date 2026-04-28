// app/login/page.tsx
import { Suspense } from "react"
import LoginClient from "./LoginClient"

function LoginFallback() {
  return <main className="authFallback" />
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginClient />
    </Suspense>
  )
}