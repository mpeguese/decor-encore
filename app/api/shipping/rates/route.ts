// app/api/shipping/rates/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerSupabaseClient } from "@/app/lib/supabase/server"
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js"

type OrderRow = {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  status: string
  fulfillment_method: string | null
}

type ListingRow = {
  id: string
  fulfillment_type: string
  shipping_origin_zip: string | null
  package_weight_lb: number | null
  package_length_in: number | null
  package_width_in: number | null
  package_height_in: number | null
}

type ShippoRate = {
  object_id?: string
  amount?: string
  currency?: string
  provider?: string
  servicelevel?: {
    name?: string
    token?: string
  }
  service?: string
  estimated_days?: number
  duration_terms?: string
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

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeState(value: unknown) {
  return normalizeString(value).toUpperCase().slice(0, 2)
}

function normalizeZip(value: unknown) {
  return normalizeString(value).slice(0, 10)
}

function toNumber(value: unknown) {
  const numberValue = Number(value || 0)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function weightLbToOz(weightLb: number) {
  return Number((weightLb * 16).toFixed(2))
}

function listingAllowsShipping(listingFulfillmentType: string) {
  return (
    listingFulfillmentType === "shipping" ||
    listingFulfillmentType === "pickup_or_shipping"
  )
}

export async function POST(request: NextRequest) {
  try {
    const shippoToken = process.env.SHIPPO_API_TOKEN

    if (!shippoToken) {
      return NextResponse.json(
        { error: "Missing SHIPPO_API_TOKEN." },
        { status: 500 }
      )
    }

    const body = await request.json().catch(() => ({}))

    const orderId = normalizeString(body.orderId)
    const shipToName = normalizeString(body.shipToName)
    const shipToLine1 = normalizeString(body.shipToLine1)
    const shipToLine2 = normalizeString(body.shipToLine2)
    const shipToCity = normalizeString(body.shipToCity)
    const shipToState = normalizeState(body.shipToState)
    const shipToPostalCode = normalizeZip(body.shipToPostalCode)
    const shipToCountry = normalizeString(body.shipToCountry) || "US"

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order ID." },
        { status: 400 }
      )
    }

    if (
      !shipToName ||
      !shipToLine1 ||
      !shipToCity ||
      !shipToState ||
      !shipToPostalCode
    ) {
      return NextResponse.json(
        { error: "Enter a complete shipping address." },
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
        { error: "Please sign in to calculate shipping." },
        { status: 401 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: orderData, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, listing_id, buyer_id, seller_id, status, fulfillment_method")
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
        { error: "Shipping can only be updated before payment." },
        { status: 409 }
      )
    }

    if (order.fulfillment_method !== "shipping") {
      return NextResponse.json(
        { error: "Choose shipping before calculating rates." },
        { status: 409 }
      )
    }

    const { data: listingData, error: listingError } = await supabaseAdmin
      .from("listings")
      .select(
        "id, fulfillment_type, shipping_origin_zip, package_weight_lb, package_length_in, package_width_in, package_height_in"
      )
      .eq("id", order.listing_id)
      .single()

    if (listingError || !listingData) {
      return NextResponse.json(
        { error: "Listing not found." },
        { status: 404 }
      )
    }

    const listing = listingData as ListingRow

    if (!listingAllowsShipping(listing.fulfillment_type)) {
      return NextResponse.json(
        { error: "Shipping is not available for this listing." },
        { status: 409 }
      )
    }

    if (
      !listing.shipping_origin_zip ||
      !listing.package_weight_lb ||
      !listing.package_length_in ||
      !listing.package_width_in ||
      !listing.package_height_in
    ) {
      return NextResponse.json(
        {
          error:
            "This listing is missing package details needed for shipping rates.",
        },
        { status: 409 }
      )
    }

    const parcel = {
      length: String(toNumber(listing.package_length_in)),
      width: String(toNumber(listing.package_width_in)),
      height: String(toNumber(listing.package_height_in)),
      distance_unit: "in",
      weight: String(weightLbToOz(toNumber(listing.package_weight_lb))),
      mass_unit: "oz",
    }

    const shippoController = new AbortController()
    const shippoTimeout = setTimeout(() => {
      shippoController.abort()
    }, 25000)

    let shippoResponse: Response
    let shippoPayload: any = null

    try {
      shippoResponse = await fetch("https://api.goshippo.com/shipments/", {
        method: "POST",
        headers: {
          Authorization: `ShippoToken ${shippoToken}`,
          "Content-Type": "application/json",
        },
        signal: shippoController.signal,
        body: JSON.stringify({
          address_from: {
            name: "Decor Encore Seller",
            zip: listing.shipping_origin_zip,
            country: "US",
          },
          address_to: {
            name: shipToName,
            street1: shipToLine1,
            street2: shipToLine2 || undefined,
            city: shipToCity,
            state: shipToState,
            zip: shipToPostalCode,
            country: shipToCountry,
          },
          parcels: [parcel],
          async: false,
        }),
      })

      shippoPayload = await shippoResponse.json().catch(() => null)
    } catch (shippoError) {
      clearTimeout(shippoTimeout)

      return NextResponse.json(
        {
          error:
            shippoError instanceof DOMException &&
            shippoError.name === "AbortError"
              ? "Shippo took too long to return shipping rates. Please try again."
              : "Unable to connect to Shippo for shipping rates.",
        },
        { status: 504 }
      )
    } finally {
      clearTimeout(shippoTimeout)
    }

    if (!shippoResponse.ok) {
      return NextResponse.json(
        {
          error:
            shippoPayload?.detail ||
            shippoPayload?.message ||
            "Unable to retrieve shipping rates.",
          provider: shippoPayload,
        },
        { status: 502 }
      )
    }

    const rawRates = Array.isArray(shippoPayload?.rates)
      ? (shippoPayload.rates as ShippoRate[])
      : []

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

    await supabaseAdmin
      .from("order_shipping_rate_quotes")
      .delete()
      .eq("order_id", order.id)
      .is("selected_at", null)

    const preferredCarrierOrder: Record<string, number> = {
  USPS: 1,
  UPS: 2,
  FedEx: 3,
}

const excludedServiceWords = [
  "express",
  "overnight",
  "next day",
  "2nd day",
  "second day",
  "saturday",
]

const quoteRows = rawRates
  .map((rate) => {
    const amount = Number(rate.amount || 0)
    const carrier = rate.provider || "Carrier"
    const service =
      rate.servicelevel?.name ||
      rate.servicelevel?.token ||
      rate.service ||
      "Shipping"

    if (!Number.isFinite(amount) || amount <= 0) return null

    return {
      order_id: order.id,
      listing_id: order.listing_id,
      buyer_id: order.buyer_id,
      seller_id: order.seller_id,
      provider: "shippo",
      provider_rate_id: rate.object_id || null,
      carrier,
      service,
      rate_amount: amount,
      currency: (rate.currency || "USD").toLowerCase(),
      estimated_days: rate.estimated_days || null,
      origin_postal_code: listing.shipping_origin_zip,
      destination_postal_code: shipToPostalCode,
      package_weight_lb: listing.package_weight_lb,
      package_length_in: listing.package_length_in,
      package_width_in: listing.package_width_in,
      package_height_in: listing.package_height_in,
      raw_rate: rate,
      expires_at: expiresAt,
    }
  })
  .filter((rate): rate is NonNullable<typeof rate> => {
    if (!rate) return false

    const serviceName = rate.service.toLowerCase()
    const isExcluded = excludedServiceWords.some((word) =>
      serviceName.includes(word)
    )

    return !isExcluded
  })
  .sort((a, b) => {
    const amountDifference = Number(a.rate_amount || 0) - Number(b.rate_amount || 0)

    if (amountDifference !== 0) return amountDifference

    const carrierA = preferredCarrierOrder[a.carrier] || 99
    const carrierB = preferredCarrierOrder[b.carrier] || 99

    return carrierA - carrierB
  })
  .slice(0, 3)

    if (quoteRows.length === 0) {
      return NextResponse.json(
        { error: "No shipping rates were returned for this address." },
        { status: 409 }
      )
    }

    const { data: insertedQuotes, error: quoteInsertError } =
      await supabaseAdmin
        .from("order_shipping_rate_quotes")
        .insert(quoteRows)
        .select(
          "id, provider, provider_rate_id, carrier, service, rate_amount, currency, estimated_days, expires_at, created_at"
        )

    if (quoteInsertError) {
      return NextResponse.json(
        { error: quoteInsertError.message },
        { status: 500 }
      )
    }

    await supabaseAdmin
      .from("orders")
      .update({
        ship_to_name: shipToName,
        ship_to_line1: shipToLine1,
        ship_to_line2: shipToLine2 || null,
        ship_to_city: shipToCity,
        ship_to_state: shipToState,
        ship_to_postal_code: shipToPostalCode,
        ship_to_country: shipToCountry,
        shipping_amount: 0,
        shipping_rate_provider: null,
        shipping_rate_id: null,
        shipping_carrier: null,
        shipping_service: null,
        shipping_estimated_days: null,
        shipping_rate_expires_at: null,
        stripe_payment_intent_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)

    return NextResponse.json({
      ok: true,
      rates: insertedQuotes || [],
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to calculate shipping."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}