// app/lib/notifications/sms.ts
import "server-only"

import twilio from "twilio"
import { createAdminClient } from "@/app/lib/supabase/admin"

type SmsEventType =
  | "seller_item_sold"
  | "buyer_order_update"
  | "buyer_ready_for_pickup"
  | "buyer_order_cancelled"
  | "seller_new_message"
  | "buyer_new_message"

type SendTransactionalSmsInput = {
  userId: string
  eventType: SmsEventType
  body: string
  relatedListingId?: string | null
  relatedOrderId?: string | null
  relatedConversationId?: string | null
  relatedMessageId?: string | null
  metadata?: Record<string, unknown>
}

type ProfileSmsRow = {
  id: string
  phone: string | null
  sms_opt_in: boolean
  sms_opt_out_at: string | null
}

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    return null
  }

  return twilio(accountSid, authToken)
}

function getMessagingServiceSid() {
  return process.env.TWILIO_MESSAGING_SERVICE_SID || null
}

function normalizePhoneForTwilio(phone: string | null | undefined) {
  if (!phone) return null

  const trimmed = phone.trim()

  if (!trimmed) return null

  if (trimmed.startsWith("+")) {
    return trimmed
  }

  const digitsOnly = trimmed.replace(/\D/g, "")

  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`
  }

  if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    return `+${digitsOnly}`
  }

  return null
}

function trimSmsBody(body: string) {
  return body.replace(/\s+/g, " ").trim().slice(0, 480)
}

async function logNotificationEvent(input: {
  userId: string
  eventType: SmsEventType
  recipient?: string | null
  body: string
  status: "sent" | "skipped" | "failed"
  provider?: string | null
  providerMessageId?: string | null
  errorMessage?: string | null
  relatedListingId?: string | null
  relatedOrderId?: string | null
  relatedConversationId?: string | null
  relatedMessageId?: string | null
  metadata?: Record<string, unknown>
}) {
  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin.from("notification_events").insert({
    user_id: input.userId,
    channel: "sms",
    event_type: input.eventType,
    recipient: input.recipient || null,
    subject: null,
    body: input.body,
    status: input.status,
    provider: input.provider || "twilio",
    provider_message_id: input.providerMessageId || null,
    error_message: input.errorMessage || null,
    related_listing_id: input.relatedListingId || null,
    related_order_id: input.relatedOrderId || null,
    related_conversation_id: input.relatedConversationId || null,
    related_message_id: input.relatedMessageId || null,
    metadata: input.metadata || {},
  })

  if (error) {
    console.error("Failed to log SMS notification event:", error.message)
  }
}

export async function sendTransactionalSms(input: SendTransactionalSmsInput) {
  const supabaseAdmin = createAdminClient()
  const body = trimSmsBody(input.body)

  const { data: profileData, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, phone, sms_opt_in, sms_opt_out_at")
    .eq("id", input.userId)
    .single()

  if (profileError || !profileData) {
    await logNotificationEvent({
      userId: input.userId,
      eventType: input.eventType,
      body,
      status: "skipped",
      errorMessage: "Profile not found.",
      relatedListingId: input.relatedListingId,
      relatedOrderId: input.relatedOrderId,
      relatedConversationId: input.relatedConversationId,
      relatedMessageId: input.relatedMessageId,
      metadata: input.metadata,
    })

    return {
      sent: false,
      status: "skipped",
      reason: "profile_not_found",
    }
  }

  const profile = profileData as ProfileSmsRow
  const normalizedPhone = normalizePhoneForTwilio(profile.phone)

  if (!profile.sms_opt_in || profile.sms_opt_out_at) {
    await logNotificationEvent({
      userId: input.userId,
      eventType: input.eventType,
      recipient: normalizedPhone,
      body,
      status: "skipped",
      errorMessage: "User has not opted into SMS notifications.",
      relatedListingId: input.relatedListingId,
      relatedOrderId: input.relatedOrderId,
      relatedConversationId: input.relatedConversationId,
      relatedMessageId: input.relatedMessageId,
      metadata: input.metadata,
    })

    return {
      sent: false,
      status: "skipped",
      reason: "not_opted_in",
    }
  }

  if (!normalizedPhone) {
    await logNotificationEvent({
      userId: input.userId,
      eventType: input.eventType,
      recipient: profile.phone,
      body,
      status: "skipped",
      errorMessage: "Missing or invalid phone number.",
      relatedListingId: input.relatedListingId,
      relatedOrderId: input.relatedOrderId,
      relatedConversationId: input.relatedConversationId,
      relatedMessageId: input.relatedMessageId,
      metadata: input.metadata,
    })

    return {
      sent: false,
      status: "skipped",
      reason: "invalid_phone",
    }
  }

  const client = getTwilioClient()
  const messagingServiceSid = getMessagingServiceSid()

  if (!client || !messagingServiceSid) {
    await logNotificationEvent({
      userId: input.userId,
      eventType: input.eventType,
      recipient: normalizedPhone,
      body,
      status: "failed",
      errorMessage: "Missing Twilio environment variables.",
      relatedListingId: input.relatedListingId,
      relatedOrderId: input.relatedOrderId,
      relatedConversationId: input.relatedConversationId,
      relatedMessageId: input.relatedMessageId,
      metadata: input.metadata,
    })

    return {
      sent: false,
      status: "failed",
      reason: "missing_twilio_env",
    }
  }

  try {
    const message = await client.messages.create({
      to: normalizedPhone,
      messagingServiceSid,
      body,
    })

    await logNotificationEvent({
      userId: input.userId,
      eventType: input.eventType,
      recipient: normalizedPhone,
      body,
      status: "sent",
      providerMessageId: message.sid,
      relatedListingId: input.relatedListingId,
      relatedOrderId: input.relatedOrderId,
      relatedConversationId: input.relatedConversationId,
      relatedMessageId: input.relatedMessageId,
      metadata: input.metadata,
    })

    return {
      sent: true,
      status: "sent",
      providerMessageId: message.sid,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown Twilio SMS error."

    await logNotificationEvent({
      userId: input.userId,
      eventType: input.eventType,
      recipient: normalizedPhone,
      body,
      status: "failed",
      errorMessage,
      relatedListingId: input.relatedListingId,
      relatedOrderId: input.relatedOrderId,
      relatedConversationId: input.relatedConversationId,
      relatedMessageId: input.relatedMessageId,
      metadata: input.metadata,
    })

    return {
      sent: false,
      status: "failed",
      reason: errorMessage,
    }
  }
}