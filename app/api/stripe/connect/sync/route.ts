import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerClient } from "@supabase/ssr"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "")

async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}

function getOnboardingStatus(account: Stripe.Account) {
  if (account.charges_enabled && account.payouts_enabled) {
    return "active"
  }

  if (account.requirements?.disabled_reason) {
    return "restricted"
  }

  if ((account.requirements?.currently_due || []).length > 0) {
    return "needs_more_info"
  }

  if (account.details_submitted) {
    return "pending_review"
  }

  return "onboarding_started"
}

export async function GET() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Missing STRIPE_SECRET_KEY environment variable." },
      { status: 500 }
    )
  }

  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  const { data: payoutAccount, error: payoutError } = await supabase
    .from("seller_payout_accounts")
    .select("id, seller_id, stripe_account_id")
    .eq("seller_id", user.id)
    .maybeSingle()

  if (payoutError) {
    return NextResponse.json({ error: payoutError.message }, { status: 500 })
  }

  if (!payoutAccount?.stripe_account_id) {
    return NextResponse.json({
      status: "not_started",
      message: "No Stripe connected account found for this seller.",
    })
  }

  const account = await stripe.accounts.retrieve(
    payoutAccount.stripe_account_id
  )

  const nextStatus = getOnboardingStatus(account)

  const { error: updateError } = await supabase
    .from("seller_payout_accounts")
    .update({
      onboarding_status: nextStatus,
      charges_enabled: Boolean(account.charges_enabled),
      payouts_enabled: Boolean(account.payouts_enabled),
      details_submitted: Boolean(account.details_submitted),
      requirements_currently_due: account.requirements?.currently_due || [],
      requirements_eventually_due: account.requirements?.eventually_due || [],
      updated_at: new Date().toISOString(),
    })
    .eq("seller_id", user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    stripe_account_id: account.id,
    onboarding_status: nextStatus,
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted,
    requirements_currently_due: account.requirements?.currently_due || [],
  })
}