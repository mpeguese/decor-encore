// app/lib/admin/requireAdmin.ts
import { redirect } from "next/navigation"
import { createClient as createServerSupabaseClient } from "@/app/lib/supabase/server"

export type AdminRole = "owner" | "admin" | "support"

export type AdminAccess = {
  id: string
  user_id: string
  role: AdminRole
  status: "active" | "inactive"
  display_name: string | null
}

export async function getAdminAccess() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      user: null,
      admin: null,
    }
  }

  const { data: adminData } = await supabase
    .from("admin_users")
    .select("id, user_id, role, status, display_name")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  return {
    user,
    admin: (adminData || null) as AdminAccess | null,
  }
}

export async function requireAdmin(next = "/admin") {
  const access = await getAdminAccess()

  if (!access.user) {
    redirect(`/admin/login?next=${encodeURIComponent(next)}`)
  }

  return access
}