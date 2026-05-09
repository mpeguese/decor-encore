/// <reference lib="deno.ns" />

// supabase/functions/send-order-notification/index.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1"

type OrderEventRecord = {
  id: string
  order_id: string
  event_type: string
  note: string | null
  created_at: string
}

type WebhookPayload = {
  type?: string
  table?: string
  schema?: string
  record?: OrderEventRecord
  old_record?: unknown
}

type OrderRow = {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  status: string
  subtotal: number | null
  shipping_amount: number | null
  platform_fee: number | null
  total: number | null
  created_at: string
}

type ProfileRow = {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  full_name: string | null
}

type ListingRow = {
  id: string
  title: string
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || ""
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || ""
const NOTIFICATION_WEBHOOK_SECRET =
  Deno.env.get("NOTIFICATION_WEBHOOK_SECRET") || ""

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  })
}

function getProfileName(profile: ProfileRow | null) {
  if (!profile) return "there"

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ")

  return name || profile.full_name || "there"
}

function formatMoney(value: number | null | undefined) {
  return `$${Number(value || 0).toFixed(2)}`
}

function buildConfirmationNumber(orderId: string) {
  const clean = orderId.replace(/-/g, "").toUpperCase()
  return `DE-${clean.slice(0, 4)}-${clean.slice(-6)}`
}

function getNotificationTarget(eventType: string) {
  const buyerEvents = new Set([
    "seller_confirmed",
    "pickup_delivery_arranged",
    "seller_marked_shipped",
    "order_cancelled",
    "refund_processed",
  ])

  const sellerEvents = new Set([
    "mock_payment_completed",
    "payment_received",
    "buyer_confirmed_received",
    "cancellation_requested",
  ])

  if (buyerEvents.has(eventType)) return "buyer"
  if (sellerEvents.has(eventType)) return "seller"

  return ""
}

function getEmailContent({
  event,
  order,
  listing,
  buyer,
  seller,
  recipientRole,
}: {
  event: OrderEventRecord
  order: OrderRow
  listing: ListingRow | null
  buyer: ProfileRow | null
  seller: ProfileRow | null
  recipientRole: "buyer" | "seller"
}) {
  const listingTitle = listing?.title || "your Decor Encore order"
  const confirmationNumber = buildConfirmationNumber(order.id)
  const buyerName = getProfileName(buyer)
  const sellerName = getProfileName(seller)
  const orderTotal = formatMoney(order.total)

  const basePreview = `Order ${confirmationNumber} · ${listingTitle}`

  if (event.event_type === "mock_payment_completed" || event.event_type === "payment_received") {
    return {
      subject: `New sale on Decor Encore: ${listingTitle}`,
      preview: basePreview,
      heading: "You made a sale",
      body: `Great news — ${buyerName} purchased "${listingTitle}" for ${orderTotal}. Open your sales page to confirm the order and coordinate fulfillment.`,
      ctaText: "View sale",
      ctaPath: `/seller/orders/${order.id}`,
    }
  }

  if (event.event_type === "seller_confirmed") {
    return {
      subject: `Your Decor Encore order was confirmed`,
      preview: basePreview,
      heading: "Your order was confirmed",
      body: `${sellerName} confirmed your order for "${listingTitle}". You can now coordinate pickup or delivery in Decor Encore messages.`,
      ctaText: "View order",
      ctaPath: `/orders/${order.id}/confirmation`,
    }
  }

  if (event.event_type === "pickup_delivery_arranged") {
    return {
      subject: `Pickup or delivery was arranged`,
      preview: basePreview,
      heading: "Fulfillment details were arranged",
      body: `Pickup or delivery details were marked arranged for "${listingTitle}". Check your order timeline and messages for details.`,
      ctaText: "View order",
      ctaPath: `/orders/${order.id}/confirmation`,
    }
  }

  if (event.event_type === "seller_marked_shipped") {
    return {
      subject: `Your Decor Encore order is on the way`,
      preview: basePreview,
      heading: "Your order is on the way",
      body: `${sellerName} marked "${listingTitle}" as shipped. Check your order timeline and messages for fulfillment updates.`,
      ctaText: "View order",
      ctaPath: `/orders/${order.id}/confirmation`,
    }
  }

  if (event.event_type === "buyer_confirmed_received") {
    return {
      subject: `Buyer confirmed receipt`,
      preview: basePreview,
      heading: "The buyer confirmed receipt",
      body: `${buyerName} confirmed that "${listingTitle}" was received. This order is now marked complete.`,
      ctaText: "View sale",
      ctaPath: `/seller/orders/${order.id}`,
    }
  }

  if (event.event_type === "cancellation_requested") {
    return {
      subject: `Cancellation requested for ${listingTitle}`,
      preview: basePreview,
      heading: "Buyer requested cancellation",
      body: `${buyerName} requested cancellation for "${listingTitle}". Review the order, message the buyer, or cancel the order if it cannot be fulfilled.`,
      ctaText: "View sale",
      ctaPath: `/seller/orders/${order.id}`,
    }
  }

  if (event.event_type === "order_cancelled") {
    return {
      subject: `Your Decor Encore order was cancelled`,
      preview: basePreview,
      heading: "Order cancelled",
      body: `Your order for "${listingTitle}" was cancelled. If payment was already made, refund handling may require Decor Encore support review.`,
      ctaText: "View order",
      ctaPath: `/orders/${order.id}/confirmation`,
    }
  }

  return {
    subject:
      recipientRole === "seller"
        ? `Update on your Decor Encore sale`
        : `Update on your Decor Encore order`,
    preview: basePreview,
    heading: "Order update",
    body:
      event.note ||
      `There is an update for "${listingTitle}" on Decor Encore.`,
    ctaText: recipientRole === "seller" ? "View sale" : "View order",
    ctaPath:
      recipientRole === "seller"
        ? `/seller/orders/${order.id}`
        : `/orders/${order.id}/confirmation`,
  }
}

function buildEmailHtml({
  heading,
  body,
  ctaText,
  ctaUrl,
  confirmationNumber,
  listingTitle,
  orderTotal,
}: {
  heading: string
  body: string
  ctaText: string
  ctaUrl: string
  confirmationNumber: string
  listingTitle: string
  orderTotal: string
}) {
  return `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#ffe9f3;font-family:Arial,Helvetica,sans-serif;color:#512d38;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffe9f3;padding:28px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:rgba(255,255,255,0.84);border:1px solid rgba(81,45,56,0.08);border-radius:28px;overflow:hidden;box-shadow:0 22px 70px rgba(81,45,56,0.12);">
            <tr>
              <td style="padding:24px 24px 10px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td valign="middle" style="padding:0;color:#512d38;font-size:24px;font-weight:900;letter-spacing:-0.04em;line-height:1.15;white-space:nowrap;">
                      Decor Encore
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:8px 24px 4px;">
                <p style="margin:0;color:#b27092;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:0.14em;">Order update</p>
                <h1 style="margin:8px 0 0;font-size:34px;line-height:0.96;letter-spacing:-0.06em;color:#512d38;">${heading}</h1>
              </td>
            </tr>

            <tr>
              <td style="padding:12px 24px 4px;">
                <p style="margin:0;color:rgba(81,45,56,0.72);font-size:15px;line-height:1.5;font-weight:700;">${body}</p>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(81,45,56,0.12);border-bottom:1px solid rgba(81,45,56,0.12);padding:12px 0;">
                  <tr>
                    <td style="padding:8px 0;color:rgba(81,45,56,0.56);font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.12em;">Confirmation</td>
                    <td align="right" style="padding:8px 0;color:#512d38;font-size:13px;font-weight:900;">${confirmationNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:rgba(81,45,56,0.56);font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.12em;">Item</td>
                    <td align="right" style="padding:8px 0;color:#512d38;font-size:13px;font-weight:900;">${listingTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:rgba(81,45,56,0.56);font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.12em;">Total</td>
                    <td align="right" style="padding:8px 0;color:#512d38;font-size:16px;font-weight:900;">${orderTotal}</td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:4px 24px 26px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0;">
                  <tr>
                    <td align="center" bgcolor="#512d38" style="border-radius:999px;background:#512d38;box-shadow:0 16px 34px rgba(81,45,56,0.22);">
                      <a href="${ctaUrl}" style="display:block;padding:16px 26px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:900;line-height:1;letter-spacing:-0.01em;border-radius:999px;">
                        ${ctaText}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 24px;background:rgba(255,233,243,0.56);">
                <p style="margin:0;color:rgba(81,45,56,0.56);font-size:12px;line-height:1.45;font-weight:700;">
                  Decor Encore helps once-loved event decor live again. If you did not expect this email, you can ignore it.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function buildEmailText({
  heading,
  body,
  ctaUrl,
  confirmationNumber,
  listingTitle,
  orderTotal,
}: {
  heading: string
  body: string
  ctaUrl: string
  confirmationNumber: string
  listingTitle: string
  orderTotal: string
}) {
  return `${heading}

${body}

Confirmation: ${confirmationNumber}
Item: ${listingTitle}
Total: ${orderTotal}

View in Decor Encore:
${ctaUrl}
`
}

serve(async (request) => {
  try {
    if (request.method === "OPTIONS") {
      return jsonResponse({ ok: true })
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, 405)
    }

    const incomingSecret = request.headers.get("x-notification-secret") || ""

    if (!NOTIFICATION_WEBHOOK_SECRET || incomingSecret !== NOTIFICATION_WEBHOOK_SECRET) {
      return jsonResponse({ error: "Unauthorized." }, 401)
    }

    if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
      return jsonResponse(
        { error: "Missing Resend configuration." },
        500
      )
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse(
        { error: "Missing Supabase function configuration." },
        500
      )
    }

    const payload = (await request.json()) as WebhookPayload
    const event = payload.record

    if (!event?.id || !event.order_id || !event.event_type) {
      return jsonResponse({ error: "Invalid webhook payload." }, 400)
    }

    const recipientRole = getNotificationTarget(event.event_type)

    if (!recipientRole) {
      return jsonResponse({
        ok: true,
        skipped: true,
        reason: `No email configured for event type ${event.event_type}.`,
      })
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, listing_id, buyer_id, seller_id, status, subtotal, shipping_amount, platform_fee, total, created_at"
      )
      .eq("id", event.order_id)
      .single()

    if (orderError || !order) {
      return jsonResponse(
        { error: orderError?.message || "Order not found." },
        404
      )
    }

    const typedOrder = order as OrderRow

    const [{ data: listing }, { data: buyer }, { data: seller }] =
      await Promise.all([
        supabase
          .from("listings")
          .select("id, title")
          .eq("id", typedOrder.listing_id)
          .single(),
        supabase
          .from("profiles")
          .select("id, email, first_name, last_name, full_name")
          .eq("id", typedOrder.buyer_id)
          .single(),
        supabase
          .from("profiles")
          .select("id, email, first_name, last_name, full_name")
          .eq("id", typedOrder.seller_id)
          .single(),
      ])

    const typedListing = (listing || null) as ListingRow | null
    const typedBuyer = (buyer || null) as ProfileRow | null
    const typedSeller = (seller || null) as ProfileRow | null

    const recipientProfile = recipientRole === "buyer" ? typedBuyer : typedSeller
    const recipientEmail = recipientProfile?.email || ""

    if (!recipientEmail) {
      return jsonResponse({
        ok: true,
        skipped: true,
        reason: `No email found for ${recipientRole}.`,
      })
    }

    const siteUrl =
      Deno.env.get("SITE_URL") ||
      Deno.env.get("NEXT_PUBLIC_SITE_URL") ||
      "https://decor-encore.com"

    const content = getEmailContent({
      event,
      order: typedOrder,
      listing: typedListing,
      buyer: typedBuyer,
      seller: typedSeller,
      recipientRole,
    })

    const listingTitle = typedListing?.title || "Decor Encore order"
    const confirmationNumber = buildConfirmationNumber(typedOrder.id)
    const orderTotal = formatMoney(typedOrder.total)
    const ctaUrl = `${siteUrl}${content.ctaPath}`

    const html = buildEmailHtml({
      heading: content.heading,
      body: content.body,
      ctaText: content.ctaText,
      ctaUrl,
      confirmationNumber,
      listingTitle,
      orderTotal,
    })

    const text = buildEmailText({
      heading: content.heading,
      body: content.body,
      ctaUrl,
      confirmationNumber,
      listingTitle,
      orderTotal,
    })

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [recipientEmail],
        subject: content.subject,
        html,
        text,
        headers: {
          "X-Entity-Ref-ID": event.id,
        },
      }),
    })

    const resendPayload = await resendResponse.json().catch(() => null)

    if (!resendResponse.ok) {
      console.error("Resend error", resendPayload)

      return jsonResponse(
        {
          error: "Resend send failed.",
          details: resendPayload,
        },
        502
      )
    }

    return jsonResponse({
      ok: true,
      event_id: event.id,
      event_type: event.event_type,
      recipient_role: recipientRole,
      resend: resendPayload,
    })
  } catch (error) {
    console.error(error)

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected notification error.",
      },
      500
    )
  }
})