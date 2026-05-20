// app/admin/orders/[orderId]/AdminRefundButton.tsx
"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import styles from "../../admin.module.css"

type AdminRefundButtonProps = {
  orderId: string
  disabled: boolean
  total: number
  refundStatus: string | null
  stripeRefundId: string | null
}

const refundReasons = [
  "Seller cancelled / cannot fulfill",
  "Item unavailable",
  "Item not as described",
  "Order could not be completed",
  "Buyer courtesy adjustment",
  "Other support decision",
]

function formatMoney(value: number | null | undefined) {
  return `$${Number(value || 0).toFixed(2)}`
}

function parseMoney(value: string) {
  const cleaned = value.replace(/[^0-9.]/g, "")
  const parsed = Number(cleaned)

  if (!Number.isFinite(parsed)) return 0

  return Number(parsed.toFixed(2))
}

function formatRefundInput(value: string) {
  const cleaned = value.replace(/[^0-9.]/g, "")

  const parts = cleaned.split(".")
  const whole = parts[0] || ""

  if (parts.length === 1) {
    return whole
  }

  const decimal = parts.slice(1).join("").slice(0, 2)

  return `${whole}.${decimal}`
}

export default function AdminRefundButton({
  orderId,
  disabled,
  total,
  refundStatus,
  stripeRefundId,
}: AdminRefundButtonProps) {
  const router = useRouter()

  const [submittingFull, setSubmittingFull] = useState(false)
  const [submittingPartial, setSubmittingPartial] = useState(false)
  const [partialAmount, setPartialAmount] = useState("")
  const [partialReason, setPartialReason] = useState(refundReasons[0])
  const [partialNote, setPartialNote] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const alreadyFullyRefunded =
    disabled ||
    refundStatus === "succeeded" ||
    refundStatus === "refunded" ||
    refundStatus === "fully_refunded"

  const hasAnyRefund = Boolean(stripeRefundId) || Boolean(refundStatus)

  const parsedPartialAmount = useMemo(() => {
    return parseMoney(partialAmount)
  }, [partialAmount])

  async function handleFullRefund() {
    setMessage("")
    setError("")

    const confirmed = window.confirm(
      `Issue a full refund for ${formatMoney(
        total
      )}?\n\nThis will refund the buyer, reverse the seller transfer, and refund the Decor Encore platform fee. This cannot be undone.`
    )

    if (!confirmed) return

    setSubmittingFull(true)

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refundType: "full",
          reason: "Full admin refund",
          requestId: crypto.randomUUID(),
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to issue refund.")
      }

      setMessage("Full refund issued successfully.")
      router.refresh()
    } catch (refundError) {
      setError(
        refundError instanceof Error
          ? refundError.message
          : "Unable to issue refund."
      )
    } finally {
      setSubmittingFull(false)
    }
  }

  async function handlePartialRefund() {
    setMessage("")
    setError("")

    if (parsedPartialAmount <= 0) {
      setError("Enter a partial refund amount greater than $0.00.")
      return
    }

    if (parsedPartialAmount >= total) {
      setError("Use the full refund action for the full order amount.")
      return
    }

    const confirmed = window.confirm(
      `Issue a partial refund for ${formatMoney(
        parsedPartialAmount
      )}?\n\nThis will refund the buyer, reverse the seller transfer proportionally, and refund the Decor Encore platform fee proportionally. This cannot be undone.`
    )

    if (!confirmed) return

    setSubmittingPartial(true)

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refundType: "partial",
          amount: parsedPartialAmount,
          reason: partialReason,
          note: partialNote,
          requestId: crypto.randomUUID(),
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to issue partial refund.")
      }

      setMessage(`Partial refund of ${formatMoney(parsedPartialAmount)} issued.`)
      setPartialAmount("")
      setPartialNote("")
      router.refresh()
    } catch (refundError) {
      setError(
        refundError instanceof Error
          ? refundError.message
          : "Unable to issue partial refund."
      )
    } finally {
      setSubmittingPartial(false)
    }
  }

  return (
    <div className={styles.adminRefundBox}>
      <div>
        <span>Admin refund</span>
        <strong>
          {alreadyFullyRefunded
            ? "Refund unavailable"
            : hasAnyRefund
              ? "Additional refund available"
              : "Refund actions available"}
        </strong>
        <p>
          Refunds reverse the seller transfer and refund the Decor Encore
          platform fee based on the refund amount. Stripe processing fees are
          not returned by Stripe.
        </p>
      </div>

      <div className={styles.adminRefundActions}>
        <button
          type="button"
          className={styles.adminDangerButton}
          onClick={handleFullRefund}
          disabled={alreadyFullyRefunded || hasAnyRefund || submittingFull}
        >
          {submittingFull
            ? "Issuing refund..."
            : hasAnyRefund
              ? "Full refund unavailable"
              : `Full refund ${formatMoney(total)}`}
        </button>
      </div>

      <details className={styles.adminPartialRefundDetails}>
        <summary>
          <span>Partial refund</span>
          <strong>Custom amount</strong>
        </summary>

        <div className={styles.adminPartialRefundForm}>
          <label>
            <span>Refund amount</span>
            <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={partialAmount}
                onChange={(event) => {
                    setPartialAmount(formatRefundInput(event.target.value))
                }}
                onBlur={() => {
                    if (!partialAmount) return

                    const parsed = parseMoney(partialAmount)

                    if (parsed > 0) {
                    setPartialAmount(parsed.toFixed(2))
                    }
                }}
                disabled={alreadyFullyRefunded || submittingPartial}
            />
          </label>

          <label>
            <span>Reason</span>
            <select
              value={partialReason}
              onChange={(event) => setPartialReason(event.target.value)}
              disabled={alreadyFullyRefunded || submittingPartial}
            >
              {refundReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Admin note</span>
            <textarea
              value={partialNote}
              onChange={(event) => setPartialNote(event.target.value)}
              placeholder="Optional internal note for the order timeline."
              rows={3}
              disabled={alreadyFullyRefunded || submittingPartial}
            />
          </label>

          <button
            type="button"
            className={styles.adminSecondaryDangerButton}
            onClick={handlePartialRefund}
            disabled={
              alreadyFullyRefunded ||
              submittingPartial ||
              parsedPartialAmount <= 0
            }
          >
            {submittingPartial
              ? "Issuing partial refund..."
              : `Issue partial refund${
                  parsedPartialAmount > 0
                    ? ` ${formatMoney(parsedPartialAmount)}`
                    : ""
                }`}
          </button>
        </div>
      </details>

      {message ? <p className={styles.adminSuccessText}>{message}</p> : null}
      {error ? <p className={styles.adminErrorText}>{error}</p> : null}
    </div>
  )
}