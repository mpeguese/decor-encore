// app/api/orders/[orderId]/fulfillment/route.ts
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient as createServerSupabaseClient } from "@/app/lib/supabase/server"
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js"

type RouteContext = {
  params: Promise<{
    orderId: string
  }>
}

type FulfillmentMethod = "pickup" | "shipping"

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
  fulfillment_type: string
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

function methodIsAllowed(listingFulfillmentType: string, method: FulfillmentMethod) {
  if (method === "pickup") {
    return (
      listingFulfillmentType === "pickup" ||
      listingFulfillmentType === "pickup_or_shipping"
    )
  }

  return (
    listingFulfillmentType === "shipping" ||
    listingFulfillmentType === "pickup_or_shipping"
  )
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { orderId } = await context.params
    const body = await request.json().catch(() => ({}))

    const fulfillmentMethod = body.fulfillmentMethod as FulfillmentMethod | undefined

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order ID." },
        { status: 400 }
      )
    }

    if (
      fulfillmentMethod !== "pickup" &&
      fulfillmentMethod !== "shipping"
    ) {
      return NextResponse.json(
        { error: "Choose pickup or shipping." },
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
        { error: "Please sign in to update fulfillment." },
        { status: 401 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const stripe = getStripe()

    const { data: orderData, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, listing_id, buyer_id, seller_id, status, stripe_payment_intent_id")
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
        { error: "Fulfillment can only be changed before payment." },
        { status: 409 }
      )
    }

    const { data: listingData, error: listingError } = await supabaseAdmin
      .from("listings")
      .select("id, fulfillment_type")
      .eq("id", order.listing_id)
      .single()

    if (listingError || !listingData) {
      return NextResponse.json(
        { error: "Listing not found." },
        { status: 404 }
      )
    }

    const listing = listingData as ListingRow

    if (!methodIsAllowed(listing.fulfillment_type, fulfillmentMethod)) {
      return NextResponse.json(
        { error: "This fulfillment method is not available for this listing." },
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
        // If the existing PaymentIntent cannot be cancelled, continue clearing it
        // so checkout can create a fresh one with the updated fulfillment totals.
      }
    }

    const now = new Date().toISOString()

    const updatePayload =
      fulfillmentMethod === "pickup"
        ? {
            fulfillment_method: "pickup",
            fulfillment_selected_at: now,
            shipping_amount: 0,
            shipping_rate_provider: null,
            shipping_rate_id: null,
            shipping_carrier: null,
            shipping_service: null,
            shipping_estimated_days: null,
            shipping_rate_expires_at: null,
            stripe_payment_intent_id: null,
            updated_at: now,
          }
        : {
            fulfillment_method: "shipping",
            fulfillment_selected_at: now,
            shipping_amount: 0,
            shipping_rate_provider: null,
            shipping_rate_id: null,
            shipping_carrier: null,
            shipping_service: null,
            shipping_estimated_days: null,
            shipping_rate_expires_at: null,
            stripe_payment_intent_id: null,
            updated_at: now,
          }

    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from("orders")
      .update(updatePayload)
      .eq("id", order.id)
      .select(
        "id, listing_id, buyer_id, seller_id, status, subtotal, shipping_amount, platform_fee, total, fulfillment_method, fulfillment_selected_at, ship_to_name, ship_to_line1, ship_to_line2, ship_to_city, ship_to_state, ship_to_postal_code, ship_to_country, shipping_rate_provider, shipping_rate_id, shipping_carrier, shipping_service, shipping_estimated_days, shipping_rate_expires_at"
      )
      .single()

    if (updateError || !updatedOrder) {
      return NextResponse.json(
        { error: updateError?.message || "Unable to update fulfillment." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      order: updatedOrder,
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to update fulfillment."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}