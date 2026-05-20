// app/api/admin/orders/[orderId]/refund/route.ts
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient as createServerSupabaseClient } from "@/app/lib/supabase/server"
import { createAdminSupabaseClient } from "@/app/lib/admin/supabaseAdmin"

type RouteContext = {
  params: Promise<{
    orderId: string
  }>
}

type RefundRequestBody = {
  refundType?: "full" | "partial"
  amount?: number
  reason?: string
  note?: string
  requestId?: string
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
  stripe_payment_intent_id: string | null
  stripe_refund_id: string | null
  refund_status: string | null
  refund_amount: number | null
}

type AdminUserRow = {
  id: string
  user_id: string
  role: string
  status: string
}

function getStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY

  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY")
  }

  return new Stripe(stripeSecretKey)
}

function toCents(value: number | null | undefined) {
  return Math.round(Number(value || 0) * 100)
}

function fromCents(value: number) {
  return Number((value / 100).toFixed(2))
}

function formatMoney(value: number | null | undefined) {
  return `$${Number(value || 0).toFixed(2)}`
}

function cleanText(value: unknown) {
  if (typeof value !== "string") return ""
  return value.trim().slice(0, 500)
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { orderId } = await context.params

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order ID." },
        { status: 400 }
      )
    }

    const body = (await request.json().catch(() => ({}))) as RefundRequestBody

    const refundType = body.refundType === "partial" ? "partial" : "full"
    const reason = cleanText(body.reason) || "Admin refund"
    const adminNote = cleanText(body.note)
    const requestId = cleanText(body.requestId)

    const authSupabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError,
    } = await authSupabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: "Please sign in with an admin account." },
        { status: 401 }
      )
    }

    const supabase = createAdminSupabaseClient()

    const { data: adminData, error: adminError } = await supabase
      .from("admin_users")
      .select("id, user_id, role, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    if (adminError) {
      return NextResponse.json(
        { error: adminError.message },
        { status: 500 }
      )
    }

    const admin = adminData as AdminUserRow | null

    if (!admin) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      )
    }

    const stripe = getStripe()

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, listing_id, buyer_id, seller_id, status, subtotal, shipping_amount, platform_fee, total, stripe_payment_intent_id, stripe_refund_id, refund_status, refund_amount"
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

    if (!order.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: "This order does not have a Stripe PaymentIntent." },
        { status: 409 }
      )
    }

    if (order.status === "cancelled") {
      return NextResponse.json(
        { error: "Cancelled orders cannot be refunded from this action." },
        { status: 409 }
      )
    }

    const totalCents = toCents(order.total)
    const alreadyRefundedCents = toCents(order.refund_amount)
    const remainingRefundableCents = totalCents - alreadyRefundedCents

    if (remainingRefundableCents <= 0) {
      return NextResponse.json(
        { error: "This order has already been fully refunded." },
        { status: 409 }
      )
    }

    let refundAmountCents = remainingRefundableCents

    if (refundType === "partial") {
      refundAmountCents = toCents(body.amount)

      if (!Number.isFinite(refundAmountCents) || refundAmountCents <= 0) {
        return NextResponse.json(
          { error: "Enter a valid partial refund amount." },
          { status: 400 }
        )
      }

      if (refundAmountCents >= remainingRefundableCents) {
        return NextResponse.json(
          {
            error:
              "Partial refund amount must be less than the remaining refundable amount. Use full refund for the remaining balance.",
          },
          { status: 400 }
        )
      }
    }

    if (!Number.isFinite(refundAmountCents) || refundAmountCents <= 0) {
      return NextResponse.json(
        { error: "Invalid refund amount." },
        { status: 400 }
      )
    }

    if (refundAmountCents > remainingRefundableCents) {
      return NextResponse.json(
        {
          error: `Refund amount cannot exceed the remaining refundable amount of ${formatMoney(
            fromCents(remainingRefundableCents)
          )}.`,
        },
        { status: 400 }
      )
    }

    const refundAmount = fromCents(refundAmountCents)
    const cumulativeRefundAmount = fromCents(
      alreadyRefundedCents + refundAmountCents
    )
    const isNowFullyRefunded =
      alreadyRefundedCents + refundAmountCents >= totalCents

    const idempotencyKey =
      refundType === "partial"
        ? `decor-encore-admin-partial-refund-${order.id}-${requestId || `${refundAmountCents}-${Date.now()}`}`
        : `decor-encore-admin-full-refund-${order.id}`

    const paymentIntent = await stripe.paymentIntents.retrieve(
      order.stripe_payment_intent_id,
      {
        expand: ["latest_charge"],
      }
    )

    const latestCharge =
      typeof paymentIntent.latest_charge === "string"
        ? null
        : paymentIntent.latest_charge

    const chargeWithTransfer = latestCharge as
      | (Stripe.Charge & {
          transfer?: string | Stripe.Transfer | null
          })
      | null

    const hasAssociatedTransfer = Boolean(chargeWithTransfer?.transfer)

    const refundCreateParams: Stripe.RefundCreateParams = {
      payment_intent: order.stripe_payment_intent_id,
      amount: refundAmountCents,
      metadata: {
        order_id: order.id,
        listing_id: order.listing_id,
        buyer_id: order.buyer_id,
        seller_id: order.seller_id,
        admin_user_id: user.id,
        refund_type: refundType,
        refund_reason: reason,
        refund_policy:
        refundType === "partial"
            ? "partial_seller_or_order_issue"
            : "seller_or_order_issue",
          transfer_reversal_attempted: hasAssociatedTransfer ? "true" : "false",
      },
    }

    if (hasAssociatedTransfer) {
      refundCreateParams.reverse_transfer = true
      refundCreateParams.refund_application_fee = true
    }

    const refund = await stripe.refunds.create(refundCreateParams, {
      idempotencyKey,
    })

    const stripeRefundStatus = refund.status || "processing"
    const now = new Date().toISOString()

    const nextOrderStatus = isNowFullyRefunded
      ? "refunded"
      : "partially_refunded"

    const nextRefundStatus = isNowFullyRefunded
      ? stripeRefundStatus === "succeeded"
        ? "succeeded"
        : stripeRefundStatus
      : "partially_refunded"

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: nextOrderStatus,
        stripe_refund_id: refund.id,
        refund_status: nextRefundStatus,
        refund_amount: cumulativeRefundAmount,
        refunded_at: now,
        updated_at: now,
      })
      .eq("id", order.id)

    if (updateError) {
      return NextResponse.json(
        {
          error:
            "Stripe refund was created, but the order could not be updated. Please review this order manually.",
          stripeRefundId: refund.id,
        },
        { status: 500 }
      )
    }

    const eventType = isNowFullyRefunded
      ? "refund_processed"
      : "partial_refund_processed"

    const transferNote = hasAssociatedTransfer
        ? refundType === "partial"
            ? "Seller transfer reversed proportionally. Decor Encore platform fee refunded proportionally."
            : "Seller transfer reversed. Decor Encore platform fee refunded."
        : "No associated seller transfer was found on this Stripe charge, so only the buyer payment was refunded through Stripe."

        const baseNote =
        refundType === "partial"
            ? `Partial admin refund issued for ${formatMoney(refundAmount)}. ${transferNote}`
            : `Full admin refund issued for ${formatMoney(refundAmount)}. ${transferNote}`

    await supabase.from("order_events").insert({
      order_id: order.id,
      event_type: eventType,
      note: [
        baseNote,
        `Reason: ${reason}.`,
        adminNote ? `Admin note: ${adminNote}.` : "",
        `Stripe refund status: ${stripeRefundStatus}.`,
        `Stripe refund ID: ${refund.id}.`,
      ]
        .filter(Boolean)
        .join(" "),
    })

    return NextResponse.json({
      ok: true,
      refundId: refund.id,
      refundStatus: nextRefundStatus,
      stripeRefundStatus,
      refundAmount,
      cumulativeRefundAmount,
      remainingRefundableAmount: fromCents(totalCents - toCents(cumulativeRefundAmount)),
      orderStatus: nextOrderStatus,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to issue refund."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}