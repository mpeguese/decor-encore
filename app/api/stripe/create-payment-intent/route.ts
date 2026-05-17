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
  subtotal: number
  shipping_amount: number
  platform_fee: number
  total: number
  fulfillment_method: string | null
  stripe_payment_intent_id: string | null
}

type SellerPayoutAccountRow = {
  stripe_account_id: string | null
  onboarding_status: string
  charges_enabled: boolean
  payouts_enabled: boolean
  details_submitted: boolean
}

type ListingRow = {
  id: string
  status: string
  quantity: number | null
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

function toCents(value: number) {
  return Math.round(Number(value || 0) * 100)
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

    if (
      order.fulfillment_method !== "pickup" &&
      order.fulfillment_method !== "shipping"
    ) {
      return NextResponse.json(
        { error: "Choose pickup or shipping before payment." },
        { status: 409 }
      )
    }

    const { data: listingData, error: listingError } = await supabaseAdmin
      .from("listings")
      .select("id, status, quantity, fulfillment_type")
      .eq("id", order.listing_id)
      .single()

    if (listingError || !listingData) {
      return NextResponse.json(
        { error: "Listing not found." },
        { status: 404 }
      )
    }

    const listing = listingData as ListingRow

    if (listing.status !== "published") {
      return NextResponse.json(
        {
          error:
            listing.status === "sold"
              ? "This item has already been sold."
              : "This listing is no longer available.",
        },
        { status: 409 }
      )
    }

    if (Number(listing.quantity || 0) <= 0) {
      return NextResponse.json(
        { error: "This item is no longer available." },
        { status: 409 }
      )
    }

    const pickupAllowed =
      listing.fulfillment_type === "pickup" ||
      listing.fulfillment_type === "pickup_or_shipping"

    const shippingAllowed =
      listing.fulfillment_type === "shipping" ||
      listing.fulfillment_type === "pickup_or_shipping"

    if (order.fulfillment_method === "pickup" && !pickupAllowed) {
      return NextResponse.json(
        { error: "Pickup is not available for this listing." },
        { status: 409 }
      )
    }

    if (order.fulfillment_method === "shipping" && !shippingAllowed) {
      return NextResponse.json(
        { error: "Shipping is not available for this listing." },
        { status: 409 }
      )
    }

    if (
      order.fulfillment_method === "shipping" &&
      Number(order.shipping_amount || 0) <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Shipping needs a calculated rate before payment can be processed.",
        },
        { status: 409 }
      )
    }

    const { data: payoutData, error: payoutError } = await supabaseAdmin
      .from("seller_payout_accounts")
      .select(
        "stripe_account_id, onboarding_status, charges_enabled, payouts_enabled, details_submitted"
      )
      .eq("seller_id", order.seller_id)
      .maybeSingle()

    if (payoutError) {
      return NextResponse.json(
        { error: payoutError.message },
        { status: 500 }
      )
    }

    const payoutAccount = payoutData as SellerPayoutAccountRow | null

    if (
      !payoutAccount?.stripe_account_id ||
      !payoutAccount.charges_enabled ||
      !payoutAccount.details_submitted
    ) {
      return NextResponse.json(
        {
          error:
            "Checkout is not available because this seller has not finished payout setup.",
        },
        { status: 409 }
      )
    }

    const amount = toCents(order.total)
    const applicationFeeAmount = toCents(order.platform_fee)
    const transferAmount = toCents(
      Number(order.subtotal || 0) + Number(order.shipping_amount || 0)
    )

    if (!Number.isFinite(amount) || amount < 50) {
      return NextResponse.json(
        { error: "Order total is too low for card payment." },
        { status: 400 }
      )
    }

    if (!Number.isFinite(applicationFeeAmount) || applicationFeeAmount < 0) {
      return NextResponse.json(
        { error: "Invalid platform fee." },
        { status: 400 }
      )
    }

    let existingIntent: Stripe.PaymentIntent | null = null

    if (order.stripe_payment_intent_id) {
      existingIntent = await stripe.paymentIntents.retrieve(
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

      await stripe.paymentIntents.cancel(existingIntent.id)
    }

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: payoutAccount.stripe_account_id,
        },
        metadata: {
          order_id: order.id,
          listing_id: order.listing_id,
          buyer_id: order.buyer_id,
          seller_id: order.seller_id,
          seller_stripe_account_id: payoutAccount.stripe_account_id,
          platform_fee_amount: String(applicationFeeAmount),
          seller_transfer_amount: String(transferAmount),
        },
      },
      {
        idempotencyKey: `decor-encore-connect-order-${order.id}-${Date.now()}`,
      }
    )

    await supabaseAdmin
      .from("orders")
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        seller_stripe_account_id: payoutAccount.stripe_account_id,
        stripe_application_fee_amount: Number(order.platform_fee || 0),
        stripe_transfer_amount: Number(
          Number(order.subtotal || 0) + Number(order.shipping_amount || 0)
        ),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)

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