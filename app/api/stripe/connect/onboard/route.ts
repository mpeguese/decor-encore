// app/api/stripe/connect/onboard/route.ts
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerClient } from "@supabase/ssr"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "")

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "")
}

function getOnboardingStatus(account: Stripe.Account) {
  if (account.charges_enabled && account.payouts_enabled) {
    return "active"
  }

  if (account.details_submitted) {
    return "needs_more_info"
  }

  return "onboarding_started"
}

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

async function handleStripeOnboarding() {
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
    return NextResponse.redirect(
      `${getSiteUrl()}/login?next=/seller/payouts&reason=payouts`
    )
  }

  const { data: existingPayoutAccount, error: payoutLookupError } =
    await supabase
      .from("seller_payout_accounts")
      .select(
        "id, seller_id, stripe_account_id, onboarding_status, charges_enabled, payouts_enabled, details_submitted"
      )
      .eq("seller_id", user.id)
      .maybeSingle()

  if (payoutLookupError) {
    return NextResponse.json(
      { error: payoutLookupError.message },
      { status: 500 }
    )
  }

  let stripeAccountId = existingPayoutAccount?.stripe_account_id || ""

  if (!stripeAccountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: user.email || undefined,
      capabilities: {
        card_payments: {
          requested: true,
        },
        transfers: {
          requested: true,
        },
      },
      metadata: {
        seller_id: user.id,
        app: "decor_encore",
      },
    })

    stripeAccountId = account.id
  }

  const stripeAccount = await stripe.accounts.retrieve(stripeAccountId)

  const { error: upsertError } = await supabase
    .from("seller_payout_accounts")
    .upsert(
      {
        seller_id: user.id,
        stripe_account_id: stripeAccount.id,
        onboarding_status: getOnboardingStatus(stripeAccount),
        charges_enabled: Boolean(stripeAccount.charges_enabled),
        payouts_enabled: Boolean(stripeAccount.payouts_enabled),
        details_submitted: Boolean(stripeAccount.details_submitted),
        requirements_currently_due:
          stripeAccount.requirements?.currently_due || [],
        requirements_eventually_due:
          stripeAccount.requirements?.eventually_due || [],
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "seller_id",
      }
    )

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  const siteUrl = getSiteUrl()

  const accountLink = await stripe.accountLinks.create({
    account: stripeAccount.id,
    refresh_url: `${siteUrl}/seller/payouts?stripe=refresh`,
    return_url: `${siteUrl}/seller/payouts?stripe=return`,
    type: "account_onboarding",
  })

  return NextResponse.redirect(accountLink.url)
}

export async function GET() {
  return handleStripeOnboarding()
}

export async function POST() {
  return handleStripeOnboarding()
}