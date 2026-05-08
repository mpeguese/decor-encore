/// <reference lib="deno.ns" />

// supabase/functions/send-message-reminders/index.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1"

type QueueRow = {
  id: string
  conversation_id: string
  message_id: string
  sender_id: string
  recipient_id: string
  status: string
  send_after: string
}

type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  read_at: string | null
}

type ConversationRow = {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  order_id: string | null
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function getProfileName(profile: ProfileRow | null) {
  if (!profile) return "there"

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ")

  return name || profile.full_name || "there"
}

function getMessagePreview(value: string) {
  const cleaned = value.replace(/\s+/g, " ").trim()

  if (cleaned.length <= 140) return cleaned

  return `${cleaned.slice(0, 137)}...`
}

function buildEmailHtml({
  recipientName,
  senderName,
  listingTitle,
  messagePreview,
  ctaUrl,
}: {
  recipientName: string
  senderName: string
  listingTitle: string
  messagePreview: string
  ctaUrl: string
}) {
  const safeRecipientName = escapeHtml(recipientName)
  const safeSenderName = escapeHtml(senderName)
  const safeListingTitle = escapeHtml(listingTitle)
  const safeMessagePreview = escapeHtml(messagePreview)

  return `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#ffe9f3;font-family:Arial,Helvetica,sans-serif;color:#512d38;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffe9f3;padding:28px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff8fb;border:1px solid #ffffff;border-radius:28px;overflow:hidden;box-shadow:0 22px 70px rgba(81,45,56,0.12);">
            <tr>
              <td style="padding:24px 24px 10px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td valign="middle" style="padding:0;color:#512d38;font-size:26px;font-weight:900;letter-spacing:-0.045em;line-height:1.15;white-space:nowrap;">
                      Decor Encore
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:8px 24px 4px;">
                <p style="margin:0;color:#b27092;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:0.14em;">Message reminder</p>
                <h1 style="margin:8px 0 0;font-size:34px;line-height:0.96;letter-spacing:-0.06em;color:#512d38;">You have a message waiting</h1>
              </td>
            </tr>

            <tr>
              <td style="padding:12px 24px 4px;">
                <p style="margin:0;color:rgba(81,45,56,0.72);font-size:15px;line-height:1.5;font-weight:700;">
                  Hi ${safeRecipientName}, ${safeSenderName} sent you a message about "${safeListingTitle}" and it has not been answered yet.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(81,45,56,0.12);border-bottom:1px solid rgba(81,45,56,0.12);padding:12px 0;">
                  <tr>
                    <td style="padding:8px 0;color:rgba(81,45,56,0.56);font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.12em;">Listing</td>
                    <td align="right" style="padding:8px 0;color:#512d38;font-size:13px;font-weight:900;">${safeListingTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:rgba(81,45,56,0.56);font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.12em;">From</td>
                    <td align="right" style="padding:8px 0;color:#512d38;font-size:13px;font-weight:900;">${safeSenderName}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding:12px 0 6px;color:#512d38;font-size:14px;font-weight:800;line-height:1.45;">
                      “${safeMessagePreview}”
                    </td>
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
                        Reply to message
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 24px;background:#ffe9f3;">
                <p style="margin:0;color:rgba(81,45,56,0.56);font-size:12px;line-height:1.45;font-weight:700;">
                  Decor Encore helps buyers and sellers coordinate safely inside the platform. Reply in Decor Encore messages to keep your order details together.
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
  recipientName,
  senderName,
  listingTitle,
  messagePreview,
  ctaUrl,
}: {
  recipientName: string
  senderName: string
  listingTitle: string
  messagePreview: string
  ctaUrl: string
}) {
  return `You have a message waiting

Hi ${recipientName}, ${senderName} sent you a message about "${listingTitle}" and it has not been answered yet.

Message:
"${messagePreview}"

Reply in Decor Encore:
${ctaUrl}
`
}

async function markQueueRow(
  queueId: string,
  status: "sent" | "skipped" | "failed",
  fields: Record<string, unknown> = {}
) {
  const timestampField =
    status === "sent" ? "sent_at" : status === "skipped" ? "skipped_at" : "failed_at"

  await supabase
    .from("message_notification_queue")
    .update({
      status,
      [timestampField]: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...fields,
    })
    .eq("id", queueId)
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
      return jsonResponse({ error: "Missing Resend configuration." }, 500)
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse(
        { error: "Missing Supabase function configuration." },
        500
      )
    }

    const { data: queueRows, error: queueError } = await supabase
      .from("message_notification_queue")
      .select(
        "id, conversation_id, message_id, sender_id, recipient_id, status, send_after"
      )
      .eq("status", "pending")
      .lte("send_after", new Date().toISOString())
      .order("send_after", { ascending: true })
      .limit(25)

    if (queueError) {
      return jsonResponse({ error: queueError.message }, 500)
    }

    const rows = (queueRows || []) as QueueRow[]
    const results: Record<string, unknown>[] = []

    for (const row of rows) {
      try {
        const { data: messageData, error: messageError } = await supabase
          .from("messages")
          .select("id, conversation_id, sender_id, body, created_at, read_at")
          .eq("id", row.message_id)
          .single()

        if (messageError || !messageData) {
          await markQueueRow(row.id, "skipped", {
            error_message: "Message not found.",
          })

          results.push({
            queue_id: row.id,
            status: "skipped",
            reason: "Message not found.",
          })

          continue
        }

        const message = messageData as MessageRow

        if (message.read_at) {
          await markQueueRow(row.id, "skipped", {
            error_message: "Message already read.",
          })

          results.push({
            queue_id: row.id,
            status: "skipped",
            reason: "Message already read.",
          })

          continue
        }

        const { data: replyData } = await supabase
          .from("messages")
          .select("id")
          .eq("conversation_id", row.conversation_id)
          .eq("sender_id", row.recipient_id)
          .gt("created_at", message.created_at)
          .limit(1)

        if (replyData && replyData.length > 0) {
          await markQueueRow(row.id, "skipped", {
            error_message: "Recipient already replied.",
          })

          results.push({
            queue_id: row.id,
            status: "skipped",
            reason: "Recipient already replied.",
          })

          continue
        }

        const { data: conversationData, error: conversationError } =
          await supabase
            .from("conversations")
            .select("id, listing_id, buyer_id, seller_id, order_id")
            .eq("id", row.conversation_id)
            .single()

        if (conversationError || !conversationData) {
          await markQueueRow(row.id, "skipped", {
            error_message: "Conversation not found.",
          })

          results.push({
            queue_id: row.id,
            status: "skipped",
            reason: "Conversation not found.",
          })

          continue
        }

        const conversation = conversationData as ConversationRow

        const [{ data: recipientData }, { data: senderData }, { data: listingData }] =
          await Promise.all([
            supabase
              .from("profiles")
              .select("id, email, first_name, last_name, full_name")
              .eq("id", row.recipient_id)
              .single(),
            supabase
              .from("profiles")
              .select("id, email, first_name, last_name, full_name")
              .eq("id", row.sender_id)
              .single(),
            supabase
              .from("listings")
              .select("id, title")
              .eq("id", conversation.listing_id)
              .single(),
          ])

        const recipient = (recipientData || null) as ProfileRow | null
        const sender = (senderData || null) as ProfileRow | null
        const listing = (listingData || null) as ListingRow | null

        const recipientEmail = recipient?.email || ""

        if (!recipientEmail) {
          await markQueueRow(row.id, "skipped", {
            error_message: "Recipient has no email.",
          })

          results.push({
            queue_id: row.id,
            status: "skipped",
            reason: "Recipient has no email.",
          })

          continue
        }

        const siteUrl =
          Deno.env.get("SITE_URL") ||
          Deno.env.get("NEXT_PUBLIC_SITE_URL") ||
          "https://decor-encore.com"

        const recipientName = getProfileName(recipient)
        const senderName = getProfileName(sender)
        const listingTitle = listing?.title || "a Decor Encore listing"
        const messagePreview = getMessagePreview(message.body)
        const ctaUrl = `${siteUrl}/messages?conversationId=${conversation.id}`

        const html = buildEmailHtml({
          recipientName,
          senderName,
          listingTitle,
          messagePreview,
          ctaUrl,
        })

        const text = buildEmailText({
          recipientName,
          senderName,
          listingTitle,
          messagePreview,
          ctaUrl,
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
            subject: `You have a message waiting on Decor Encore`,
            html,
            text,
            headers: {
              "X-Entity-Ref-ID": row.id,
            },
          }),
        })

        const resendPayload = await resendResponse.json().catch(() => null)

        if (!resendResponse.ok) {
          await markQueueRow(row.id, "failed", {
            error_message: JSON.stringify(resendPayload || {}),
          })

          results.push({
            queue_id: row.id,
            status: "failed",
            resend: resendPayload,
          })

          continue
        }

        await markQueueRow(row.id, "sent")

        results.push({
          queue_id: row.id,
          status: "sent",
          resend: resendPayload,
        })
      } catch (rowError) {
        await markQueueRow(row.id, "failed", {
          error_message:
            rowError instanceof Error
              ? rowError.message
              : "Unexpected row processing error.",
        })

        results.push({
          queue_id: row.id,
          status: "failed",
          error:
            rowError instanceof Error
              ? rowError.message
              : "Unexpected row processing error.",
        })
      }
    }

    return jsonResponse({
      ok: true,
      processed: rows.length,
      results,
    })
  } catch (error) {
    console.error(error)

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected message reminder error.",
      },
      500
    )
  }
})
