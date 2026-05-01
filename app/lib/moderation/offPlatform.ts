// app/lib/moderation/offPlatform.ts
export function containsOffPlatformContact(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[|]/g, "i")

  const blockedPatterns = [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /(\+?1[\s.-]?)?(\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/,
    /\b(gmail|yahoo|hotmail|icloud|outlook)\s*(dot|\.)\s*com\b/i,
    /\b(call|text|email me|message me|dm me|contact me)\b/i,
    /\b(instagram|ig|facebook|fb|tiktok|snapchat|whatsapp|telegram)\b/i,
    /\b(venmo|cashapp|cash app|zelle|paypal|apple cash)\b/i,
  ]

  return blockedPatterns.some((pattern) => pattern.test(normalized))
}