// app/api/orders/[orderId]/finalize/route.ts
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient as createServerSupabaseClient } from "@/app/lib/supabase/server"
import { createAdminClient } from "@/app/lib/supabase/admin"
import { sendTransactionalSms } from "@/app/lib/notifications/sms"

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
  stripe_payment_intent_id: string | null
}

type ListingRow = {
  id: string
  title: string
}

function getStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY

  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY")
  }

  return new Stripe(stripeSecretKey)
}

function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return "http://localhost:3000"
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { orderId } = await context.params
    const body = await request.json().catch(() => ({}))

    const paymentIntentId =
      typeof body.paymentIntentId === "string" ? body.paymentIntentId : ""

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order ID." },
        { status: 400 }
      )
    }

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Missing payment intent ID." },
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
        { error: "Please sign in to finalize this order." },
        { status: 401 }
      )
    }

    const supabaseAdmin = createAdminClient()
    const stripe = getStripe()

    const { data: orderData, error: orderError } = await supabaseAdmin
      .from("orders")
      .select(
        "id, listing_id, buyer_id, seller_id, status, stripe_payment_intent_id"
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
        { error: "You do not have access to finalize this order." },
        { status: 403 }
      )
    }

    if (order.status === "paid" || order.status === "completed") {
      const { data: existingConversation } = await supabaseAdmin
        .from("conversations")
        .select("id")
        .eq("order_id", order.id)
        .maybeSingle()

      return NextResponse.json({
        ok: true,
        alreadyFinalized: true,
        conversationId: existingConversation?.id || null,
      })
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "This order can no longer be finalized." },
        { status: 409 }
      )
    }

    if (
      order.stripe_payment_intent_id &&
      order.stripe_payment_intent_id !== paymentIntentId
    ) {
      return NextResponse.json(
        { error: "Payment intent does not match this order." },
        { status: 409 }
      )
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment has not succeeded yet." },
        { status: 409 }
      )
    }

    const metadataOrderId = paymentIntent.metadata?.order_id

    if (metadataOrderId && metadataOrderId !== order.id) {
      return NextResponse.json(
        { error: "Payment metadata does not match this order." },
        { status: 409 }
      )
    }

    const { data: listingData, error: listingError } = await supabaseAdmin
      .from("listings")
      .select("id, title")
      .eq("id", order.listing_id)
      .single()

    if (listingError || !listingData) {
      return NextResponse.json(
        { error: "Listing not found." },
        { status: 404 }
      )
    }

    const listing = listingData as ListingRow

    const { error: completeOrderError } = await authSupabase.rpc(
      "complete_mock_order",
      {
        p_order_id: order.id,
        p_payment_intent_id: paymentIntentId,
      }
    )

    if (completeOrderError) {
      return NextResponse.json(
        { error: completeOrderError.message },
        { status: 500 }
      )
    }

    const { data: existingConversation } = await supabaseAdmin
      .from("conversations")
      .select("id")
      .eq("order_id", order.id)
      .maybeSingle()

    let conversationId = existingConversation?.id || ""

    if (!conversationId) {
      const { data: listingConversation } = await supabaseAdmin
        .from("conversations")
        .select("id")
        .eq("listing_id", order.listing_id)
        .eq("buyer_id", order.buyer_id)
        .maybeSingle()

      if (listingConversation?.id) {
        conversationId = listingConversation.id

        await supabaseAdmin
          .from("conversations")
          .update({
            order_id: order.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", conversationId)
      }
    }

    if (!conversationId) {
      const { data: newConversation, error: conversationError } =
        await supabaseAdmin
          .from("conversations")
          .insert({
            order_id: order.id,
            listing_id: order.listing_id,
            buyer_id: order.buyer_id,
            seller_id: order.seller_id,
          })
          .select("id")
          .single()

      if (conversationError || !newConversation?.id) {
        return NextResponse.json(
          {
            error:
              conversationError?.message ||
              "Unable to start order conversation.",
          },
          { status: 500 }
        )
      }

      conversationId = newConversation.id
    }

    await supabaseAdmin.from("messages").insert({
      conversation_id: conversationId,
      sender_id: order.buyer_id,
      body: `Order confirmed for "${listing.title || "your item"}". 

Use this thread to coordinate pickup, delivery, and any questions with the seller.`,
    })

    await supabaseAdmin
      .from("conversations")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId)

    const sellerOrderUrl = `${getSiteUrl()}/seller/orders`

    await sendTransactionalSms({
      userId: order.seller_id,
      eventType: "seller_item_sold",
      body: `Decor Encore: Your item "${listing.title || "your listing"}" has sold. Open seller orders: ${sellerOrderUrl} Reply STOP to opt out.`,
      relatedListingId: order.listing_id,
      relatedOrderId: order.id,
      relatedConversationId: conversationId,
      metadata: {
        listingTitle: listing.title,
        buyerId: order.buyer_id,
        paymentIntentId,
      },
    })

    return NextResponse.json({
      ok: true,
      conversationId,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to finalize this order."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}