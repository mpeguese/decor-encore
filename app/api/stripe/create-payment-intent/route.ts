// app/api/stripe/create-payment-intent/route.ts
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient as createServerSupabaseClient } from "@/app/lib/supabase/server"
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js"

type OrderRow = {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  status: string
  total: number
  stripe_payment_intent_id: string | null
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

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { error: "Missing order ID." },
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
        { error: "Please sign in to continue checkout." },
        { status: 401 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const stripe = getStripe()

    const { data: orderData, error: orderError } = await supabaseAdmin
      .from("orders")
      .select(
        "id, listing_id, buyer_id, seller_id, status, total, stripe_payment_intent_id"
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
        { error: "You do not have access to this checkout." },
        { status: 403 }
      )
    }

    if (order.status === "paid" || order.status === "completed") {
      return NextResponse.json(
        { error: "This order has already been paid." },
        { status: 409 }
      )
    }

    if (order.status === "cancelled" || order.status === "refunded") {
      return NextResponse.json(
        { error: "This order can no longer be paid." },
        { status: 409 }
      )
    }

    const amount = Math.round(Number(order.total || 0) * 100)

    if (!Number.isFinite(amount) || amount < 50) {
      return NextResponse.json(
        { error: "Order total is too low for card payment." },
        { status: 400 }
      )
    }

    let paymentIntent: Stripe.PaymentIntent

    if (order.stripe_payment_intent_id) {
      const existingIntent = await stripe.paymentIntents.retrieve(
        order.stripe_payment_intent_id
      )

      if (
        existingIntent.status === "succeeded" ||
        existingIntent.status === "processing"
      ) {
        return NextResponse.json(
          { error: "This payment is already being processed." },
          { status: 409 }
        )
      }

      paymentIntent = await stripe.paymentIntents.update(existingIntent.id, {
        amount,
        currency: "usd",
        metadata: {
          order_id: order.id,
          listing_id: order.listing_id,
          buyer_id: order.buyer_id,
          seller_id: order.seller_id,
        },
      })
    } else {
      paymentIntent = await stripe.paymentIntents.create(
        {
          amount,
          currency: "usd",
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            order_id: order.id,
            listing_id: order.listing_id,
            buyer_id: order.buyer_id,
            seller_id: order.seller_id,
          },
        },
        {
          idempotencyKey: `decor-encore-order-${order.id}`,
        }
      )

      await supabaseAdmin
        .from("orders")
        .update({
          stripe_payment_intent_id: paymentIntent.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)
    }

    if (!paymentIntent.client_secret) {
      return NextResponse.json(
        { error: "Unable to initialize payment." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create payment intent."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}