// app/api/orders/[orderId]/shipping-rate/route.ts
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient as createServerSupabaseClient } from "@/app/lib/supabase/server"
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js"

type RouteContext = {
  params: Promise<{
    orderId: string
  }>
}

type OrderRow = {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  status: string
  subtotal: number
  shipping_amount: number
  platform_fee: number
  total: number
  fulfillment_method: string | null
  stripe_payment_intent_id: string | null
}

type QuoteRow = {
  id: string
  order_id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  provider: string
  provider_rate_id: string | null
  carrier: string
  service: string
  rate_amount: number
  currency: string
  estimated_days: number | null
  expires_at: string | null
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase admin environment variables")
  }

  return createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function getStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY

  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY")
  }

  return new Stripe(stripeSecretKey)
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { orderId } = await context.params
    const body = await request.json().catch(() => ({}))
    const quoteId = typeof body.quoteId === "string" ? body.quoteId : ""

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order ID." },
        { status: 400 }
      )
    }

    if (!quoteId) {
      return NextResponse.json(
        { error: "Choose a shipping rate." },
        { status: 400 }
      )
    }

    const authSupabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError,
    } = await authSupabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: "Please sign in to select shipping." },
        { status: 401 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const stripe = getStripe()

    const { data: orderData, error: orderError } = await supabaseAdmin
      .from("orders")
      .select(
        "id, listing_id, buyer_id, seller_id, status, subtotal, shipping_amount, platform_fee, total, fulfillment_method, stripe_payment_intent_id"
      )
      .eq("id", orderId)
      .single()

    if (orderError || !orderData) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      )
    }

    const order = orderData as OrderRow

    if (order.buyer_id !== user.id) {
      return NextResponse.json(
        { error: "You do not have access to this order." },
        { status: 403 }
      )
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "Shipping can only be selected before payment." },
        { status: 409 }
      )
    }

    if (order.fulfillment_method !== "shipping") {
      return NextResponse.json(
        { error: "Choose shipping before selecting a rate." },
        { status: 409 }
      )
    }

    const { data: quoteData, error: quoteError } = await supabaseAdmin
      .from("order_shipping_rate_quotes")
      .select(
        "id, order_id, listing_id, buyer_id, seller_id, provider, provider_rate_id, carrier, service, rate_amount, currency, estimated_days, expires_at"
      )
      .eq("id", quoteId)
      .eq("order_id", order.id)
      .eq("buyer_id", user.id)
      .single()

    if (quoteError || !quoteData) {
      return NextResponse.json(
        { error: "Shipping rate not found." },
        { status: 404 }
      )
    }

    const quote = quoteData as QuoteRow

    if (quote.expires_at && new Date(quote.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "This shipping rate expired. Please calculate rates again." },
        { status: 409 }
      )
    }

    if (order.stripe_payment_intent_id) {
      try {
        const existingIntent = await stripe.paymentIntents.retrieve(
          order.stripe_payment_intent_id
        )

        if (
          existingIntent.status !== "succeeded" &&
          existingIntent.status !== "processing" &&
          existingIntent.status !== "canceled"
        ) {
          await stripe.paymentIntents.cancel(existingIntent.id)
        }
      } catch {
        // If the old intent cannot be cancelled, continue clearing it in DB
        // so checkout can initialize a fresh PaymentIntent.
      }
    }

    const now = new Date().toISOString()
    const shippingAmount = Number(Number(quote.rate_amount || 0).toFixed(2))
    const subtotal = Number(Number(order.subtotal || 0).toFixed(2))
    const platformFee = Number(Number(order.platform_fee || 0).toFixed(2))
    const total = Number((subtotal + platformFee + shippingAmount).toFixed(2))

    // Clear any previous selected quote for this order
    await supabaseAdmin
      .from("order_shipping_rate_quotes")
      .update({
        selected_at: null,
      })
      .eq("order_id", order.id)

    // Mark the chosen quote as selected
    await supabaseAdmin
      .from("order_shipping_rate_quotes")
      .update({
        selected_at: now,
      })
      .eq("id", quote.id)

    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        shipping_amount: shippingAmount,
        total,
        shipping_rate_provider: quote.provider,
        shipping_rate_id: quote.provider_rate_id || quote.id,
        shipping_carrier: quote.carrier,
        shipping_service: quote.service,
        shipping_estimated_days: quote.estimated_days,
        shipping_rate_expires_at: quote.expires_at,
        stripe_payment_intent_id: null,
        updated_at: now,
      })
      .eq("id", order.id)
      .select(
        "id, listing_id, buyer_id, seller_id, status, subtotal, shipping_amount, platform_fee, total, fulfillment_method, fulfillment_selected_at, ship_to_name, ship_to_line1, ship_to_line2, ship_to_city, ship_to_state, ship_to_postal_code, ship_to_country, shipping_rate_provider, shipping_rate_id, shipping_carrier, shipping_service, shipping_estimated_days, shipping_rate_expires_at"
      )
      .single()

    if (updateError || !updatedOrder) {
      return NextResponse.json(
        { error: updateError?.message || "Unable to select shipping rate." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      order: updatedOrder,
      rate: quote,
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to select shipping rate."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}