// app/api/orders/[orderId]/seller-cancel/route.ts
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
  total: number
  stripe_payment_intent_id: string | null
  stripe_refund_id: string | null
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

function toCents(value: number) {
  return Math.round(Number(value || 0) * 100)
}

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { orderId } = await context.params

    if (!orderId) {
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
        { error: "Please sign in to cancel this order." },
        { status: 401 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const stripe = getStripe()

    const { data: orderData, error: orderError } = await supabaseAdmin
      .from("orders")
      .select(
        "id, listing_id, buyer_id, seller_id, status, total, stripe_payment_intent_id, stripe_refund_id"
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

    if (order.seller_id !== user.id) {
      return NextResponse.json(
        { error: "You do not have access to cancel this order." },
        { status: 403 }
      )
    }

    if (order.status === "completed") {
      return NextResponse.json(
        { error: "Completed orders cannot be cancelled from this screen." },
        { status: 409 }
      )
    }

    if (order.status === "cancelled" || order.status === "refunded") {
      return NextResponse.json(
        { error: "This order has already been cancelled or refunded." },
        { status: 409 }
      )
    }

    const now = new Date().toISOString()
    const isPaidOrder = ["paid", "confirmed", "arranged"].includes(order.status)

    if (!isPaidOrder) {
      await supabaseAdmin
        .from("orders")
        .update({
          status: "cancelled",
          updated_at: now,
        })
        .eq("id", order.id)

      await supabaseAdmin
        .from("listings")
        .update({
          status: "published",
          sold_at: null,
          updated_at: now,
        })
        .eq("id", order.listing_id)
        .eq("seller_id", order.seller_id)

      const { data: eventData } = await supabaseAdmin
        .from("order_events")
        .insert({
          order_id: order.id,
          event_type: "order_cancelled",
          note: "Order was cancelled by the seller. The listing was made available again.",
        })
        .select("id, event_type, note, created_at")
        .single()

      return NextResponse.json({
        ok: true,
        status: "cancelled",
        refund: null,
        events: eventData ? [eventData] : [],
      })
    }

    if (!order.stripe_payment_intent_id) {
      return NextResponse.json(
        {
          error:
            "This order is marked paid, but no Stripe payment intent was found.",
        },
        { status: 409 }
      )
    }

    if (order.stripe_refund_id) {
      return NextResponse.json(
        { error: "This order already has a Stripe refund." },
        { status: 409 }
      )
    }

    const refundAmount = toCents(order.total)

    const refund = await stripe.refunds.create(
      {
        payment_intent: order.stripe_payment_intent_id,
        amount: refundAmount,
        reverse_transfer: true,
        refund_application_fee: false,
        metadata: {
          order_id: order.id,
          listing_id: order.listing_id,
          seller_id: order.seller_id,
          buyer_id: order.buyer_id,
          reason: "seller_cancelled_order",
        },
      },
      {
        idempotencyKey: `decor-encore-seller-cancel-refund-${order.id}`,
      }
    )

    await supabaseAdmin
      .from("orders")
      .update({
        status: "refunded",
        stripe_refund_id: refund.id,
        refund_status: refund.status || "pending",
        refund_amount: Number(order.total || 0),
        refunded_at: now,
        updated_at: now,
      })
      .eq("id", order.id)

    await supabaseAdmin
      .from("listings")
      .update({
        status: "published",
        sold_at: null,
        updated_at: now,
      })
      .eq("id", order.listing_id)
      .eq("seller_id", order.seller_id)

    const { data: eventRows } = await supabaseAdmin
      .from("order_events")
      .insert([
        {
          order_id: order.id,
          event_type: "order_cancelled",
          note: "Order was cancelled by the seller. The listing was made available again.",
        },
        {
          order_id: order.id,
          event_type: "refund_processed",
          note: "A refund was processed to the buyer's original payment method.",
        },
      ])
      .select("id, event_type, note, created_at")

    return NextResponse.json({
      ok: true,
      status: "refunded",
      refund: {
        id: refund.id,
        status: refund.status,
        amount: refund.amount,
      },
      events: eventRows || [],
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to cancel this order."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}