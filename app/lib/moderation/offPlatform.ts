// app/lib/moderation/offPlatform.ts

type ModerationResult = {
  blocked: boolean
  reason?: string
}

function normalizeText(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/[|]/g, "i")
    .replace(/[@]/g, " at ")
    .replace(/\s+/g, " ")
    .trim()
}

function getDigits(value: string) {
  return value.replace(/\D/g, "")
}

export function checkOffPlatformContact(value: unknown): ModerationResult {
  const text = normalizeText(value)
  const digits = getDigits(text)

  // 10 or 11 digit phone numbers, including broken formatting
  if (digits.length >= 10 && digits.length <= 11) {
    return { blocked: true, reason: "phone" }
  }

  // Blocks messages that are mostly digits and likely phone fragments
  // Example: "813", then "5555555" when combined with recent messages
  if (digits.length >= 7 && digits.length === text.replace(/\s/g, "").length) {
    return { blocked: true, reason: "phone_fragment" }
  }

  const rules = [
    {
      reason: "email",
      pattern: /\b[a-z0-9._%+-]+\s*(at|@)\s*[a-z0-9.-]+\s*(dot|\.)\s*[a-z]{2,}\b/i,
    },
    {
      reason: "email_provider",
      pattern: /\b(gmail|yahoo|hotmail|icloud|outlook|msn|aol)\b/i,
    },
    {
      reason: "contact_request",
      pattern: /\b(call|text|txt|sms|email|dm|message|contact)\s+(me|my|at)\b/i,
    },
    {
      reason: "social",
      pattern: /\b(instagram|insta|ig|facebook|fb|tiktok|snapchat|snap|whatsapp|telegram|messenger)\b/i,
    },
    {
      reason: "payment",
      pattern: /\b(venmo|cashapp|cash app|zelle|paypal|apple cash|cash)\b/i,
    },
  ]

  const matched = rules.find((rule) => rule.pattern.test(text))

  if (matched) {
    return { blocked: true, reason: matched.reason }
  }

  return { blocked: false }
}

export function containsOffPlatformContact(value: unknown) {
  return checkOffPlatformContact(value).blocked
}