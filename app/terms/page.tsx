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
          <p>Effective Date: Apr 26, 2026</p>
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
            These Terms incorporate our{" "}
            <Link href="/seller-policy">Seller Policy</Link>,{" "}
            <Link href="/prohibited-items">Prohibited Items Policy</Link>,{" "}
            <Link href="/payments">Payments Policy</Link>, and{" "}
            <Link href="/privacy">Privacy Policy</Link>, where applicable.
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

          <p>
            Buyers are responsible for asking questions before checkout if an
            item’s condition, size, color, quantity, pickup details, shipping
            details, or included pieces are unclear. Buyer change-of-mind,
            failure to review listing details, missed pickup arrangements, or
            incomplete communication may affect refund eligibility.
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

          <p>
            If a seller cannot fulfill an order, if an item is unavailable, or if
            an item is materially different from the listing, Decor Encore may
            review the order and may issue a full or partial refund to the buyer.
            Any seller payout, transfer, or pending payout associated with that
            order may be reversed, reduced, delayed, or adjusted.
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

          <p>
            Decor Encore may, in its discretion, review order records,
            communications, payment records, support requests, and marketplace
            activity to assist with disputes, cancellations, refunds, account
            actions, or policy enforcement.
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

          <p>
            Off-platform communication or payment may limit Decor Encore’s
            ability to verify what happened, assist with an order issue, review a
            refund request, or protect either party.
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

          <p>
            Decor Encore may charge or collect platform fees to support secure
            checkout, marketplace tools, seller features, order tracking,
            support, trust and safety, and platform operations. Platform fees may
            be refunded when Decor Encore determines that a seller, item,
            fulfillment, or order-related issue caused the refund. Platform fees
            are not automatically refunded for buyer-caused issues, buyer
            change-of-mind situations, missed pickup arrangements, or courtesy
            adjustments unless Decor Encore approves otherwise.
          </p>

          <p>
            If a refund is issued, any seller payout, transfer, or pending payout
            connected to the order may be reversed, reduced, delayed, or adjusted
            by Stripe or another payment provider based on the refund amount,
            payment structure, and provider rules.
          </p>

          <p>
            Payment processing fees, card network fees, bank fees, or other
            third-party charges may not be returned by the payment provider when
            a refund is issued. Decor Encore may treat those costs as operating
            costs, may account for them in its policies, or may handle them as
            required by applicable law.
          </p>

          <h2>11. Pickup, Shipping, and Fulfillment</h2>
          <p>
            Sellers are responsible for accurately describing fulfillment options
            and completing pickup or shipping as agreed. Buyers are responsible
            for coordinating pickup or delivery, reviewing details, and appearing
            at agreed times.
          </p>

          <p>
            Shipping rates shown at checkout are based on information provided by
            the seller, buyer shipping information, package details, and
            third-party carrier or shipping-rate providers. Rates may be
            estimates and may differ from the final cost a seller pays when
            purchasing postage or shipping an item.
          </p>

          <p>
            Sellers are responsible for properly packing shipped items,
            purchasing or arranging shipment, using the selected or reasonably
            comparable shipping service, and providing truthful fulfillment
            updates.
          </p>

          <p>
            Decor Encore is not responsible for lost items, damaged items, missed
            pickups, late deliveries, shipping carrier issues, incorrect
            addresses, unsafe meetup locations, or fulfillment disputes between
            users.
          </p>

          <p>
            Fulfillment issues may affect refund eligibility. If an order cannot
            be completed because an item is unavailable, the seller cannot
            fulfill the order, an item is materially not as described, or another
            seller or fulfillment issue occurs, Decor Encore may review the order
            and may issue a full or partial refund.
          </p>

          <h2>12. Returns, Refunds, and Disputes</h2>
          <p>
            Unless otherwise stated by the seller or required by applicable law,
            sales may be final. Refunds, returns, cancellations, and exchanges
            are not automatic and may depend on the listing, seller activity,
            buyer activity, payment status, communication history, support
            requests, and Decor Encore’s review.
          </p>

          <p>
            Decor Encore may review and process refunds or payment adjustments
            when an order cannot be completed as expected, when an item is
            unavailable, when a seller is unable to fulfill an order, when an
            item is materially not as described, when fulfillment fails, or when
            Decor Encore determines that a refund or adjustment is appropriate
            based on the order circumstances.
          </p>

          <p>
            Refunds may be full or partial. Partial refunds may be issued when
            only part of an order is affected, when an agreed adjustment is
            appropriate, or when Decor Encore determines that a full refund is
            not required. Refunds are generally returned to the buyer’s original
            payment method. The timing of a refund depends on the buyer’s payment
            provider, bank, card issuer, or other financial institution.
          </p>

          <p>
            Buyer change-of-mind requests, missed pickup arrangements, failure to
            review listing details, failure to ask questions before purchase, or
            other buyer-caused issues are not automatically eligible for a refund
            and may be reviewed at Decor Encore’s discretion.
          </p>

          <p>
            If a refund is issued, any seller payout, transfer, or pending payout
            associated with the order may be reversed, reduced, delayed, or
            adjusted. Platform fees may be refunded when Decor Encore determines
            that the seller, item, fulfillment process, or order issue caused the
            refund. Platform fees are not automatically refunded for buyer-caused
            issues or courtesy adjustments unless Decor Encore approves
            otherwise.
          </p>

          <p>
            Refunds do not automatically relist an item. A refunded item may
            remain marked as sold unless the seller or Decor Encore determines
            that the item is available and appropriate to list again. This helps
            prevent unavailable, damaged, disputed, or incorrectly fulfilled
            items from being returned to the marketplace automatically.
          </p>

          <p>
            To support fair review, buyers and sellers should keep order
            communication, payment, fulfillment coordination, and support
            requests inside Decor Encore. Off-platform communications or
            transactions may limit Decor Encore’s ability to review or resolve a
            dispute.
          </p>

          <p>
            Decor Encore may choose to assist with disputes, investigate user
            behavior, review platform records, restrict accounts, process or deny
            refunds, reverse or adjust certain platform actions, or take other
            steps we believe are appropriate. We are not obligated to resolve
            disputes, issue refunds, or guarantee any outcome unless required by
            applicable law.
          </p>

          <p>
            Decor Encore reserves the right to approve, deny, modify, or reverse
            refund requests based on order records, messages, payment status,
            seller activity, buyer activity, support requests, listing details,
            platform policies, and applicable law.
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
            fraud prevention, refund review, dispute review, or platform
            operation.
          </p>

          <h2>14. SMS/Text Message Communications</h2>
          <p>
            If you choose to provide your phone number and opt in to SMS/text
            message alerts, Decor Encore may send you text messages related to
            your account, listings, purchases, sales, unread messages, pickup or
            delivery updates, order status, security, support, and other
            important marketplace activity.
          </p>

          <p>
            SMS/text message frequency varies based on your account activity and
            marketplace activity. Message and data rates may apply. Consent to
            receive SMS/text messages is not required to buy or sell on Decor
            Encore.
          </p>

          <p>
            You may opt out of SMS/text message alerts at any time by replying
            STOP to a message. You may reply HELP for help. After opting out, you
            may still receive non-SMS communications through Decor Encore, such
            as in-app messages, emails, account notices, order updates, or other
            communications permitted by law.
          </p>

          <p>
            By opting in, you confirm that you are the account holder or
            authorized user of the phone number provided and that you agree to
            receive SMS/text messages from Decor Encore as described in these
            Terms and our Privacy Policy.
          </p>

          <h2>15. User Content</h2>
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

          <h2>16. Decor Encore Intellectual Property</h2>
          <p>
            Decor Encore owns or licenses the platform, brand, design, software,
            logos, trade names, text, graphics, interfaces, and other materials
            that make up the service. You may not copy, reproduce, modify,
            distribute, sell, reverse engineer, scrape, or exploit any part of
            the platform without permission.
          </p>

          <h2>17. Privacy</h2>
          <p>
            Our Privacy Policy explains how we collect, use, store, and share
            information. By using Decor Encore, you agree that we may collect and
            process information as described in the Privacy Policy.
          </p>

          <h2>18. Platform Availability</h2>
          <p>
            We may update, change, suspend, discontinue, or limit any part of the
            platform at any time. We do not guarantee that the platform will be
            uninterrupted, secure, error-free, or available at all times.
          </p>

          <h2>19. Enforcement</h2>
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

          <h2>20. Account Suspension or Termination</h2>
          <p>
            We may suspend or terminate your account if we believe you violated
            these Terms, created risk for the platform, harmed another user,
            engaged in fraud, attempted to bypass our policies, or used the
            platform in a way that is inconsistent with our standards.
          </p>

          <p>
            You may not create a new account to bypass suspension or termination.
          </p>

          <h2>21. Disclaimers</h2>
          <p>
            Decor Encore is provided “as is” and “as available.” To the fullest
            extent permitted by law, we disclaim all warranties, express or
            implied, including warranties of merchantability, fitness for a
            particular purpose, title, non-infringement, accuracy, availability,
            and reliability.
          </p>

          <h2>22. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Decor Encore and its owners,
            employees, contractors, affiliates, and partners will not be liable
            for indirect, incidental, special, consequential, exemplary, or
            punitive damages, or for lost profits, lost revenue, lost data,
            goodwill, business interruption, transaction losses, or damages
            arising from user conduct, listings, transactions, pickup, shipping,
            or platform use.
          </p>

          <h2>23. Indemnification</h2>
          <p>
            You agree to defend, indemnify, and hold harmless Decor Encore and
            its owners, employees, contractors, affiliates, and partners from any
            claims, liabilities, damages, losses, costs, and expenses, including
            reasonable attorneys’ fees, arising from your use of the platform,
            your content, your listings, your transactions, your violation of
            these Terms, or your violation of any law or third-party rights.
          </p>

          <h2>24. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Florida, without
            regard to conflict of law principles.
          </p>

          <h2>25. Dispute Resolution</h2>
          <p>
            Before filing a legal claim, you agree to first contact Decor Encore
            and attempt to resolve the dispute informally. If a dispute cannot be
            resolved informally, it will be handled in accordance with applicable
            law in Florida, unless a separate arbitration agreement or dispute
            process applies.
          </p>

          <h2>26. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. If we make material
            changes, we may provide notice through the platform or by other
            reasonable means. Continued use of Decor Encore after updated Terms
            become effective means you accept the updated Terms.
          </p>

          <h2>27. Contact</h2>
          <p>
            Questions about these Terms may be sent to:{" "}
            <strong>info@decor-encore.com</strong>
          </p>
        </div>
      </section>
    </main>
  )
}