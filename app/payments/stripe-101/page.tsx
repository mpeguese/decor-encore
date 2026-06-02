// app/payments/stripe-101/page.tsx
import Link from "next/link"
import styles from "@/app/seller/orders/seller-orders.module.css"

const setupSteps = [
  {
    number: "01",
    title: "Start from Seller Payouts",
    body:
      "Go to Seller → Payouts, review Quick Help, then continue to Stripe. Stripe will securely collect the details needed to verify your payout account.",
  },
  {
    number: "02",
    title: "Use a valid email and phone number",
    body:
      "Enter an email address and phone number you can access. Stripe may use these to verify your account or send important payout updates.",
  },
  {
    number: "03",
    title: "Choose the correct business type",
    body:
      "Most casual sellers should choose Individual. If you are selling through a registered business, choose the business option that matches your legal setup.",
  },
  {
    number: "04",
    title: "Enter accurate legal information",
    body:
      "Use your real legal name, date of birth, address, and identification details. The information should match your official identification and bank account.",
  },
  {
    number: "05",
    title: "Select the closest industry",
    body:
      "If Stripe asks for an industry, choose Retail, then Other merchandise or the closest available option.",
  },
  {
    number: "06",
    title: "Use Decor Encore as the website",
    body:
      "If Stripe asks for a website, enter https://decor-encore.com. This tells Stripe where your seller activity is taking place.",
  },
  {
    number: "07",
    title: "Add your payout bank account",
    body:
      "Enter the bank account where you want your seller earnings sent after a sale. Make sure the bank information is accurate before submitting.",
  },
]

const roadblocks = [
  {
    title: "Stripe says more information is required",
    body:
      "Return to Seller → Payouts and continue setup. Stripe may need a missing field, corrected information, or additional verification before your account can receive payouts.",
  },
  {
    title: "My payout status says pending review",
    body:
      "This usually means Stripe is reviewing the information you submitted. You may be able to keep using your seller account, but buyers may not be able to purchase your listings until Stripe finishes the review.",
  },
  {
    title: "My bank account will not verify",
    body:
      "Double-check the routing number, account number, account type, and account holder details. The bank account should match the person or business information you provided to Stripe.",
  },
  {
    title: "My listings cannot be purchased yet",
    body:
      "Decor Encore requires a completed Stripe payout setup before buyers can purchase your listings. This helps make sure seller earnings can be sent after a successful order.",
  },
  {
    title: "I completed Stripe, but Decor Encore still says action is needed",
    body:
      "Go back to Seller → Payouts and refresh the page. If the status does not update, use the payout setup button again to check whether Stripe still needs additional information.",
  },
]

export default function Stripe101Page() {
  return (
    <main className={styles.sellerOrdersPage}>
      <header className={styles.sellerOrdersHeader}>
        <Link href="/seller/payouts" className={styles.backLink}>
          Back
        </Link>

        <strong>Decor Encore</strong>

        <Link href="/payments" className={styles.headerAction}>
          T&amp;Cs
        </Link>
      </header>

      <section className={styles.sellerOrdersShell}>
        <div className={styles.sellerOrdersIntro}>
          <p>Stripe 101</p>
          <h1>Payout help</h1>
          {/* <span>
            A simple guide to setting up Stripe so you can receive seller
            payouts from Decor Encore.
          </span> */}
        </div>

        <section className={styles.stateCard}>
          <h2>Why Stripe is required</h2>
          <p>
            Decor Encore uses Stripe to securely process buyer payments and send
            seller payouts. Before buyers can purchase your listings, your Stripe
            payout setup must be completed so your seller earnings have a valid
            place to go.
          </p>

          <Link href="/seller/payouts">Go to payout setup</Link>
        </section>

        <section className={styles.stageCard}>
          <div className={styles.stageHeader}>
            <div>
              <p>Full Setup Guide</p>
              {/* <h2>What to enter</h2> */}
            </div>

            <span>7 steps</span>
          </div>

          <div className={styles.stageActionList}>
            {setupSteps.map((step) => (
              <div key={step.number} className={styles.stripeGuideItem}>
                <span>{step.number}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.stageCard}>
          <div className={styles.stageHeader}>
            <div>
              <p>Common issues</p>
              <h2>Roadblocks & fixes</h2>
            </div>

            <span>Help</span>
          </div>

          <div className={styles.stageActionList}>
            {roadblocks.map((item) => (
              <div key={item.title} className={styles.stripeGuideIssue}>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.stateCard}>
          <h2>When sellers get paid</h2>
          <p>
            Payout timing can depend on Stripe review, order status, and
            Stripe’s payout schedule. New Stripe accounts may take longer before
            funds are available. If Stripe needs more information, payouts may be
            delayed until the requested steps are completed.
          </p>

          <Link href="/payments">View payment terms</Link>
        </section>
      </section>
    </main>
  )
}