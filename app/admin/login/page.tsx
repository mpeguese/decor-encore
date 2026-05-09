// app/admin/login/page.tsx
import { Suspense } from "react"
import AdminLoginClient from "./AdminLoginClient"

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginClient />
    </Suspense>
  )
}