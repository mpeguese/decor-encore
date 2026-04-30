// app/terms/page.tsx
import Link from "next/link"
import styles from "@/app/auth-flow.module.css"

export default function TermsPage() {
  return (
    <main className="legal-page">
      <section className="legal-container">
        <header className={styles.authHeader}>
          <div className={styles.headerSpacer} aria-hidden="true" />

          <Link href="/login" className={styles.headerLink}>
            Back to Login
          </Link>
        </header>
        <div className="legal-header">
          <h1>Terms of Use</h1>
          <p>Effective Date: Apr 29, 2026</p>
        </div>

        <div className="legal-content">
          <p>
            These Terms of Use govern your access to and use of Decor Encore,
            including our website, marketplace, messaging tools, listing tools,
            seller features, buyer features, and any related services we provide.
            By using Decor Encore, creating an account, browsing listings,
            posting listings, communicating with other users, or completing a
            transaction, you agree to these Terms.
          </p>

          <p>
            These Terms incorporate our <Link href="/seller-policy">Seller Policy</Link>, <Link href="/prohibited-items">Prohibited Items Policy</Link>, <Link href="/payments">Payments Policy</Link>, and <Link href="/privacy">Privacy Policy</Link>, where applicable.
          </p>

          <p>
            Decor Encore is designed to help people discover, buy, sell, and
            rehome event decor. We provide the platform, but users are
            responsible for their own listings, transactions, communications,
            pickup arrangements, shipping arrangements, and compliance with these
            Terms.
          </p>

          <h2>1. Our Marketplace Role</h2>
          <p>
            Decor Encore is a marketplace platform. We are not the owner, seller,
            buyer, manufacturer, distributor, shipper, storage provider, or
            insurer of any item listed by users. Unless we clearly state
            otherwise, Decor Encore does not take possession of listed items and
            is not a party to transactions between buyers and sellers.
          </p>

          <p>
            We do not guarantee the accuracy, condition, safety, legality,
            quality, availability, or delivery of any listing. Users are solely
            responsible for evaluating listings, asking questions, confirming
            details, coordinating pickup or shipping, and deciding whether to
            complete a transaction.
          </p>

          <h2>2. Eligibility</h2>
          <p>
            You must be at least 18 years old and legally able to enter into a
            binding agreement to use Decor Encore. By using the platform, you
            represent that you meet these requirements.
          </p>

          <p>
            You may not use Decor Encore if you have previously been suspended,
            removed, or banned from the platform unless we provide written
            permission.
          </p>

          <h2>3. Accounts</h2>
          <p>
            You agree to provide accurate, current, and complete account
            information. You are responsible for maintaining the confidentiality
            of your login credentials and for all activity that occurs under your
            account.
          </p>

          <p>
            You may not impersonate another person, create misleading account
            information, use another person’s account without permission, or
            create multiple accounts to avoid restrictions, fees, enforcement
            actions, or platform rules.
          </p>

          <h2>4. Buyer Responsibilities</h2>
          <p>
            Buyers are responsible for reviewing listings carefully before making
            a purchase or arranging pickup. This includes reviewing photos,
            descriptions, price, quantity, condition, pickup location,
            fulfillment method, and any seller notes.
          </p>

          <p>
            Buyers are responsible for communicating respectfully, showing up for
            agreed pickup times, inspecting items when appropriate, and completing
            payment only through approved platform methods when payment features
            are available.
          </p>

          <h2>5. Seller Responsibilities</h2>
          <p>
            Sellers are responsible for every listing they create. Listings must
            be truthful, accurate, complete, and not misleading. Sellers must
            have the legal right to sell all listed items and must be able to
            fulfill the listing as described.
          </p>

          <p>
            Sellers are responsible for pricing, availability, pickup details,
            shipping details, item condition, quantity, measurements, included
            pieces, and any limitations or defects. Sellers must promptly update
            or remove listings that are no longer available.
          </p>

          <h2>6. Listings and Photos</h2>
          <p>
            Listing photos must show the actual item or items being offered.
            Photos should not misrepresent condition, color, quantity, size,
            quality, or what is included. Stock photos, heavily altered images,
            misleading edits, or photos of items the seller does not own may be
            removed.
          </p>

          <p>
            Decor Encore may remove, limit, hide, edit, or reject listings that
            violate our policies, appear suspicious, create safety concerns, or
            reduce the quality of the marketplace experience.
          </p>

          <h2>7. Prohibited Items and Conduct</h2>
          <p>
            You may not list illegal, stolen, counterfeit, unsafe, hazardous,
            misleading, or prohibited items. You may not use Decor Encore to
            commit fraud, harass users, evade enforcement, bypass platform rules,
            interfere with platform operations, or violate applicable laws.
          </p>

          <p>
            Additional rules are described in our Prohibited Items Policy and
            Seller Policy, which are incorporated into these Terms.
          </p>

          <h2>8. Transactions Between Users</h2>
          <p>
            Transactions are between buyers and sellers. Decor Encore is not
            responsible for whether a buyer pays, whether a seller fulfills,
            whether an item matches expectations, whether a pickup occurs, or
            whether a dispute arises between users.
          </p>

          <p>
            We may provide tools to support communication, discovery, listing,
            payment, dispute review, or trust and safety, but those tools do not
            make Decor Encore a party to the transaction.
          </p>

          <h2>9. Keeping Transactions on Decor Encore</h2>
          <p>
            To protect users and the integrity of the marketplace, users may not
            use Decor Encore to connect and then complete or attempt to complete
            the transaction outside the platform in order to avoid fees,
            safeguards, policies, or platform records.
          </p>

          <p>
            Attempts to move transactions off-platform, solicit outside payment,
            exchange contact information for the purpose of avoiding platform
            processes, or otherwise bypass Decor Encore may result in listing
            removal, account restrictions, suspension, or termination.
          </p>

          <h2>10. Payments and Fees</h2>
          <p>
            Decor Encore may offer or introduce payment processing, deposits,
            service fees, transaction fees, seller fees, buyer fees, promoted
            listings, subscriptions, or other paid features. Any applicable fees
            will be disclosed where required.
          </p>

          <p>
            Payment processing may be handled by third-party providers such as
            Stripe. When payment tools are enabled, your use of those tools may
            also be subject to additional payment terms and third-party provider
            terms.
          </p>

          <h2>11. Pickup, Shipping, and Fulfillment</h2>
          <p>
            Sellers are responsible for accurately describing fulfillment options
            and completing pickup or shipping as agreed. Buyers are responsible
            for coordinating pickup or delivery, reviewing details, and appearing
            at agreed times.
          </p>

          <p>
            Decor Encore is not responsible for lost items, damaged items, missed
            pickups, late deliveries, shipping carrier issues, incorrect
            addresses, unsafe meetup locations, or fulfillment disputes between
            users.
          </p>

          <h2>12. Returns, Refunds, and Disputes</h2>
          <p>
            Unless otherwise stated by the seller or required by applicable law,
            sales may be final. Refunds, returns, cancellations, and exchanges
            are primarily handled between buyers and sellers.
          </p>

          <p>
            Decor Encore may choose to assist with disputes, investigate user
            behavior, review platform records, restrict accounts, or reverse
            certain platform actions, but we are not obligated to resolve
            disputes or guarantee any outcome.
          </p>

          <h2>13. Messaging and Communication</h2>
          <p>
            If Decor Encore provides messaging or communication tools, users must
            use them respectfully and lawfully. Harassment, threats, spam,
            discriminatory language, abusive messages, phishing, fraud attempts,
            and off-platform circumvention are prohibited.
          </p>

          <p>
            We may review, moderate, restrict, or retain communications where
            permitted by law and necessary for safety, enforcement, support,
            fraud prevention, or platform operation.
          </p>

          <h2>14. User Content</h2>
          <p>
            You retain ownership of content you submit, including listing
            descriptions, photos, profile content, messages, and other materials.
            By submitting content, you grant Decor Encore a worldwide,
            non-exclusive, royalty-free, transferable, sublicensable license to
            use, display, reproduce, distribute, modify, crop, format, promote,
            and otherwise use that content in connection with operating,
            improving, marketing, and promoting the platform.
          </p>

          <p>
            You represent that you own or have the rights necessary to upload and
            share your content and that your content does not infringe or violate
            the rights of others.
          </p>

          <h2>15. Decor Encore Intellectual Property</h2>
          <p>
            Decor Encore owns or licenses the platform, brand, design, software,
            logos, trade names, text, graphics, interfaces, and other materials
            that make up the service. You may not copy, reproduce, modify,
            distribute, sell, reverse engineer, scrape, or exploit any part of
            the platform without permission.
          </p>

          <h2>16. Privacy</h2>
          <p>
            Our Privacy Policy explains how we collect, use, store, and share
            information. By using Decor Encore, you agree that we may collect and
            process information as described in the Privacy Policy.
          </p>

          <h2>17. Platform Availability</h2>
          <p>
            We may update, change, suspend, discontinue, or limit any part of the
            platform at any time. We do not guarantee that the platform will be
            uninterrupted, secure, error-free, or available at all times.
          </p>

          <h2>18. Enforcement</h2>
          <p>
            We may investigate suspected violations and take action at our sole
            discretion. Actions may include warning users, removing listings,
            limiting visibility, disabling features, withholding access,
            suspending accounts, terminating accounts, or reporting unlawful
            activity where appropriate.
          </p>

          <p>
            We are not required to monitor all activity, but we reserve the right
            to do so to protect users, the marketplace, and Decor Encore.
          </p>

          <h2>19. Account Suspension or Termination</h2>
          <p>
            We may suspend or terminate your account if we believe you violated
            these Terms, created risk for the platform, harmed another user,
            engaged in fraud, attempted to bypass our policies, or used the
            platform in a way that is inconsistent with our standards.
          </p>

          <p>
            You may not create a new account to bypass suspension or termination.
          </p>

          <h2>20. Disclaimers</h2>
          <p>
            Decor Encore is provided “as is” and “as available.” To the fullest
            extent permitted by law, we disclaim all warranties, express or
            implied, including warranties of merchantability, fitness for a
            particular purpose, title, non-infringement, accuracy, availability,
            and reliability.
          </p>

          <h2>21. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Decor Encore and its owners,
            employees, contractors, affiliates, and partners will not be liable
            for indirect, incidental, special, consequential, exemplary, or
            punitive damages, or for lost profits, lost revenue, lost data,
            goodwill, business interruption, transaction losses, or damages
            arising from user conduct, listings, transactions, pickup, shipping,
            or platform use.
          </p>

          <h2>22. Indemnification</h2>
          <p>
            You agree to defend, indemnify, and hold harmless Decor Encore and
            its owners, employees, contractors, affiliates, and partners from any
            claims, liabilities, damages, losses, costs, and expenses, including
            reasonable attorneys’ fees, arising from your use of the platform,
            your content, your listings, your transactions, your violation of
            these Terms, or your violation of any law or third-party rights.
          </p>

          <h2>23. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Florida, without
            regard to conflict of law principles.
          </p>

          <h2>24. Dispute Resolution</h2>
          <p>
            Before filing a legal claim, you agree to first contact Decor Encore
            and attempt to resolve the dispute informally. If a dispute cannot be
            resolved informally, it will be handled in accordance with applicable
            law in Florida, unless a separate arbitration agreement or dispute
            process applies.
          </p>

          <h2>25. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. If we make material
            changes, we may provide notice through the platform or by other
            reasonable means. Continued use of Decor Encore after updated Terms
            become effective means you accept the updated Terms.
          </p>

          <h2>26. Contact</h2>
          <p>
            Questions about these Terms may be sent to:{" "}
            <strong>[Insert Contact Email]</strong>
          </p>
        </div>
      </section>
    </main>
  )
}