// app/seller-policy/page.tsx
import Link from "next/link"
import styles from "@/app/auth-flow.module.css"


export default function SellerPolicyPage() {
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
          <h1>Seller Policy</h1>
          <p>Effective Date: Apr 29, 2026</p>
        </div>

        <div className="legal-content">
          <p>
            This Seller Policy explains the standards sellers must follow when
            listing and selling items on Decor Encore. It is designed to protect
            buyers, support seller success, and maintain a curated marketplace
            experience.
          </p>

          <p>
            By creating a listing, enabling seller access, communicating with a
            buyer, or selling through Decor Encore, you agree to this Seller
            Policy, our Terms of Use, Prohibited Items Policy, Payments Policy,
            and any other applicable rules.
          </p>

          <h2>1. Seller Responsibility</h2>
          <p>
            Sellers are solely responsible for their listings, photos,
            descriptions, prices, item condition, availability, fulfillment,
            communications, and compliance with applicable laws.
          </p>

          <p>
            Decor Encore provides tools to help sellers connect with buyers, but
            sellers are responsible for ensuring that each listing is accurate,
            lawful, and ready to fulfill.
          </p>

          <h2>2. Listing Accuracy</h2>
          <p>
            Listings must be truthful, clear, complete, and not misleading. A
            buyer should be able to understand what is included, what condition
            the item is in, how many pieces are included, how pickup or shipping
            works, and whether there are any flaws or limitations.
          </p>

          <p>
            Sellers must not exaggerate, hide defects, misstate quantity,
            misrepresent measurements, show unavailable pieces, or use vague
            language to avoid disclosing important details.
          </p>

          <h2>3. Photo Standards</h2>
          <p>
            Photos must show the actual item or bundle being sold. Clear,
            well-lit photos help buyers make decisions and support trust on the
            platform.
          </p>

          <p>Sellers may not use photos that:</p>
          <ul>
            <li>Do not represent the actual item</li>
            <li>Show items not included in the listing without explanation</li>
            <li>Hide damage, stains, missing pieces, or defects</li>
            <li>Use heavy filters or edits that misrepresent color or condition</li>
            <li>Belong to another person without permission</li>
            <li>Are copied from another listing, website, or creator without rights</li>
          </ul>

          <h2>4. Condition Standards</h2>
          <p>
            Sellers must choose the condition that best reflects the item. If an
            item has wear, damage, discoloration, missing pieces, stains, broken
            parts, or prior repairs, those details must be disclosed in the
            listing.
          </p>

          <p>
            “Used once” should only be used when an item was used for a single
            event and remains in excellent or clearly described condition. “Like
            new” should only be used when wear is minimal and disclosed.
          </p>

          <h2>5. Bundles and Full Looks</h2>
          <p>
            Bundle listings must clearly identify what is included. Sellers
            should list quantities, colors, sizes, guest count estimates,
            included decor types, missing pieces, and any items shown in photos
            that are not included.
          </p>

          <p>
            If a bundle is styled in photos with other pieces that are not part
            of the sale, the listing must clearly say so.
          </p>

          <h2>6. Pricing</h2>
          <p>
            Sellers control their own pricing, but pricing must not be deceptive.
            Sellers may not use misleading pricing, hidden charges, bait-and-
            switch tactics, fake discounts, or intentionally inaccurate prices.
          </p>

          <p>
            Any additional costs, such as shipping, delivery, packaging, or
            handling, should be disclosed where applicable.
          </p>

          <h2>7. Availability</h2>
          <p>
            Sellers must only list items they own, control, or are authorized to
            sell. Listings should be removed, paused, or updated if the item is
            sold, damaged, no longer available, reserved elsewhere, or otherwise
            unavailable.
          </p>

          <h2>8. Pickup and Fulfillment</h2>
          <p>
            Sellers must provide accurate pickup or shipping information.
            Pickup location details should be sufficient for marketplace
            discovery but should not publicly expose sensitive personal address
            information unless needed later in a transaction.
          </p>

          <p>
            Sellers are responsible for coordinating pickup times, being
            responsive, preparing items as described, and honoring agreed
            arrangements.
          </p>

          <h2>9. Shipping</h2>
          <p>
            If shipping is offered, sellers are responsible for properly packing
            items, selecting appropriate shipping methods, providing accurate
            shipping pricing, and communicating relevant shipping expectations.
          </p>

          <p>
            Fragile items, candles, glass, florals, signage, custom pieces, and
            large decor may require special handling. Sellers should not offer
            shipping if they cannot safely and reasonably fulfill it.
          </p>

          <h2>10. Communication</h2>
          <p>
            Sellers must communicate honestly, professionally, and respectfully.
            Sellers may not pressure buyers, harass users, send spam, make
            threats, use discriminatory language, or attempt to move transactions
            off-platform.
          </p>

          <p>
            Timely responses improve trust and may impact future seller
            visibility or access to seller features.
          </p>

          <h2>11. Keeping Transactions on Platform</h2>
          <p>
            Sellers may not use Decor Encore to find buyers and then complete
            transactions outside the platform to avoid fees, safeguards, records,
            or policies. This includes asking buyers to pay outside the platform
            when platform payments are available.
          </p>

          <p>
            Attempts to bypass Decor Encore may result in listing removal,
            reduced visibility, seller restrictions, suspension, or termination.
          </p>

          <h2>12. Cancellations</h2>
          <p>
            Sellers should avoid cancellations after a buyer has relied on a
            listing or arrangement. If a cancellation is unavoidable, the seller
            must notify the buyer promptly and cooperate with any applicable
            refund or dispute process.
          </p>

          <p>
            Repeated cancellations, no-shows, or failure to fulfill may lead to
            account review or restrictions.
          </p>

          <h2>13. Returns and Refunds</h2>
          <p>
            Sellers should clearly state any return or refund expectations in
            listing communications where applicable. Unless otherwise required by
            law or platform policy, returns and refunds may depend on the seller’s
            stated terms and the circumstances of the transaction.
          </p>

          <p>
            Sellers may still be subject to enforcement if a listing was
            materially inaccurate, fraudulent, unsafe, or misleading.
          </p>

          <h2>14. Prohibited Seller Behavior</h2>
          <p>Sellers may not:</p>
          <ul>
            <li>Post fake or misleading listings</li>
            <li>List stolen, illegal, unsafe, or counterfeit goods</li>
            <li>Misrepresent item condition, quantity, color, size, or availability</li>
            <li>Use photos they do not own or have permission to use</li>
            <li>Harass, threaten, pressure, or abuse buyers</li>
            <li>Manipulate pricing or platform visibility</li>
            <li>Evade platform fees or move transactions off-platform</li>
            <li>Create duplicate accounts to avoid enforcement</li>
          </ul>

          <h2>15. Seller Performance and Marketplace Quality</h2>
          <p>
            Decor Encore may consider listing accuracy, responsiveness,
            fulfillment reliability, buyer feedback, cancellations, disputes,
            policy violations, and platform behavior when determining seller
            access, visibility, or eligibility for features.
          </p>

          <p>
            We may remove listings or restrict seller privileges to protect the
            quality and safety of the marketplace.
          </p>

          <h2>16. Taxes and Legal Compliance</h2>
          <p>
            Sellers are responsible for understanding and complying with any
            applicable tax, resale, licensing, consumer protection, product
            safety, and local laws related to their sales.
          </p>

          <p>
            Decor Encore does not provide tax, legal, or accounting advice.
          </p>

          <h2>17. Enforcement</h2>
          <p>
            Decor Encore may remove listings, reduce visibility, limit seller
            tools, pause selling privileges, suspend accounts, terminate
            accounts, or take other action if we believe a seller has violated
            this policy or created risk for users or the platform.
          </p>

          <h2>18. Updates to This Policy</h2>
          <p>
            We may update this Seller Policy from time to time. Continued use of
            seller tools after updates become effective means you accept the
            updated policy.
          </p>

          <h2>19. Contact</h2>
          <p>
            Questions about this Seller Policy may be sent to:{" "}
            <strong>[Insert Contact Email]</strong>
          </p>
        </div>
      </section>
    </main>
  )
}