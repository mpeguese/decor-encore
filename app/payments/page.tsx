// app/payments/page.tsx
import Link from "next/link"
import styles from "@/app/auth-flow.module.css"

export default function PaymentsPolicyPage() {
  return (
    <main className="legal-page">
      <section className="legal-container">
        <header className={styles.authHeader}>
          <div className={styles.headerSpacer} aria-hidden="true" />

          <Link href="/terms" className={styles.headerLink}>
            Back to Terms
          </Link>
        </header>
        <div className="legal-header">
          <h1>Payments Policy</h1>
          <p>Effective Date: Apr 29, 2026</p>
        </div>

        <div className="legal-content">
          <p>
            This Payments Policy explains how payments, fees, refunds, payouts,
            and related payment features may work on Decor Encore when payment
            tools are enabled. This policy is designed to be future-ready for
            integrated payments through providers such as Stripe.
          </p>

          <p>
            If Decor Encore has not yet enabled integrated payment processing,
            certain sections of this policy may apply only once payment features
            become available.
          </p>

          <h2>1. Payment Processing</h2>
          <p>
            Decor Encore may use third-party payment processors, including Stripe
            or similar providers, to process payments, verify users, support
            seller payouts, manage refunds, and help prevent fraud.
          </p>

          <p>
            By using payment features, you agree to comply with the payment
            processor’s applicable terms, requirements, identity verification
            rules, prohibited business rules, and compliance obligations.
          </p>

          <h2>2. Decor Encore’s Role</h2>
          <p>
            Decor Encore may provide tools that help buyers and sellers complete
            transactions, but Decor Encore is not a bank, money transmitter,
            escrow company, financial institution, or payment card processor.
            Payment processing services are provided by third-party providers.
          </p>

          <h2>3. Buyer Payments</h2>
          <p>
            Buyers may be required to pay the item price, applicable service
            fees, taxes, shipping fees, delivery fees, or other disclosed charges
            at checkout.
          </p>

          <p>
            Buyers are responsible for ensuring payment information is accurate
            and that they are authorized to use the selected payment method.
          </p>

          <h2>4. Seller Payouts</h2>
          <p>
            Sellers may receive payouts through a third-party payment processor.
            Payout timing may depend on processor rules, risk review, bank
            processing times, dispute activity, refund activity, account status,
            verification status, or platform policies.
          </p>

          <p>
            Decor Encore may delay, pause, reverse, or withhold payouts where
            permitted if we suspect fraud, policy violations, disputes,
            chargebacks, illegal activity, account compromise, or other risk.
          </p>

          <h2>5. Fees</h2>
          <p>
            Decor Encore may charge fees, including but not limited to service
            fees, transaction fees, seller fees, buyer fees, listing fees,
            payment processing fees, promoted listing fees, subscription fees,
            or other paid-feature fees.
          </p>

          <p>
            Fees may be deducted from seller payouts, added to buyer checkout,
            charged separately, or handled in another disclosed manner.
          </p>

          <h2>6. Taxes</h2>
          <p>
            Users are responsible for understanding and complying with applicable
            tax obligations. Decor Encore may collect, calculate, report, or
            remit taxes where required by law or supported by payment providers.
          </p>

          <p>
            Sellers remain responsible for their own income, sales, use, resale,
            and other tax obligations unless otherwise required by law.
          </p>

          <h2>7. Refunds</h2>
          <p>
            Refunds may depend on seller terms, platform policies, payment
            provider rules, dispute outcomes, or applicable law. Decor Encore may
            provide tools to request, issue, or review refunds, but does not
            guarantee that any refund will be granted.
          </p>

          <p>
            If a refund is issued, associated platform fees, payment processing
            fees, or service fees may or may not be refundable depending on the
            circumstances and applicable rules.
          </p>

          <h2>8. Cancellations</h2>
          <p>
            If a transaction is cancelled, payment handling may depend on timing,
            fulfillment status, seller conduct, buyer conduct, payment provider
            rules, and platform policies.
          </p>

          <p>
            Repeated cancellations, no-shows, or failed fulfillment may result in
            seller restrictions or account review.
          </p>

          <h2>9. Chargebacks and Payment Disputes</h2>
          <p>
            Buyers may have rights to dispute charges through their payment card
            provider or payment processor. Sellers are responsible for
            cooperating with Decor Encore and payment processors during dispute
            review.
          </p>

          <p>
            Decor Encore may request evidence, transaction records, messages,
            pickup confirmation, shipping proof, photos, or other documentation
            to respond to a chargeback or payment dispute.
          </p>

          <p>
            If a chargeback or dispute is decided against a seller, the seller
            may be responsible for the disputed amount, fees, penalties, or
            related costs where permitted.
          </p>

          <h2>10. Fraud Prevention and Risk Review</h2>
          <p>
            Decor Encore and its payment providers may review transactions,
            accounts, listings, messages, payment activity, payout activity, and
            other signals to prevent fraud, protect users, enforce policies, and
            comply with law.
          </p>

          <p>
            We may delay or block transactions, restrict payment features,
            request additional information, pause payouts, remove listings, or
            suspend accounts if risk is detected.
          </p>

          <h2>11. Identity Verification and KYC/KYB</h2>
          <p>
            Sellers may be required to complete identity, business, tax, banking,
            or compliance verification before receiving payouts or accessing
            payment features. This may include providing legal name, date of
            birth, address, tax information, bank information, business
            information, government identification, or other required details.
          </p>

          <p>
            Failure to complete required verification may result in delayed
            payouts, disabled payment features, or account restrictions.
          </p>

          <h2>12. Off-Platform Payments</h2>
          <p>
            When Decor Encore payment tools are available, users may not use the
            platform to connect and then complete payment outside the platform in
            order to avoid fees, safeguards, records, or policies.
          </p>

          <p>
            Off-platform payment requests may result in transaction cancellation,
            listing removal, reduced visibility, account restrictions,
            suspension, or termination.
          </p>

          <h2>13. Payment Holds</h2>
          <p>
            Decor Encore or its payment providers may place holds on funds for
            reasons including new seller activity, high-risk transactions,
            unusual account behavior, buyer disputes, chargebacks, suspected
            fraud, policy violations, incomplete verification, or legal
            compliance.
          </p>

          <h2>14. Failed Payments</h2>
          <p>
            If a payment fails, the transaction may not be completed. Decor
            Encore is not responsible for fees charged by banks, card issuers, or
            payment providers due to failed payments, insufficient funds, or
            declined transactions.
          </p>

          <h2>15. Payment Errors</h2>
          <p>
            If a payment or payout is processed incorrectly, Decor Encore may
            work with payment providers to correct the error. Users agree to
            cooperate in resolving payment errors and authorize reversals or
            adjustments where appropriate and permitted.
          </p>

          <h2>16. Compliance</h2>
          <p>
            Users may not use Decor Encore payment features for illegal,
            fraudulent, restricted, sanctioned, or prohibited transactions. Users
            must comply with all applicable laws, payment provider rules, tax
            requirements, and platform policies.
          </p>

          <h2>17. Changes to Payment Features</h2>
          <p>
            Decor Encore may add, remove, modify, suspend, or discontinue payment
            features at any time. Payment features may not be available to all
            users, locations, listings, or transaction types.
          </p>

          <h2>18. Updates to This Policy</h2>
          <p>
            We may update this Payments Policy from time to time. Continued use
            of payment features after updates become effective means you accept
            the updated policy.
          </p>

          <h2>19. Contact</h2>
          <p>
            Questions about this Payments Policy may be sent to:{" "}
            <strong>[Insert Contact Email]</strong>
          </p>
        </div>
      </section>
    </main>
  )
}