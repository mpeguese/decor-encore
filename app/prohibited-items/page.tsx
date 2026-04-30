// app/prohibited-items/page.tsx
import Link from "next/link"
import styles from "@/app/auth-flow.module.css"

export default function ProhibitedItemsPage() {
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
          <h1>Prohibited Items Policy</h1>
          <p>Effective Date: Apr 26, 2026</p>
        </div>

        <div className="legal-content">
          <p>
            Decor Encore is a marketplace for event decor and related event
            styling items. This Prohibited Items Policy explains what may not be
            listed, sold, promoted, requested, or exchanged through the platform.
          </p>

          <p>
            We may remove any listing or restrict any account if we believe an
            item violates this policy, creates safety concerns, violates the law,
            harms marketplace trust, or does not fit the purpose of Decor Encore.
          </p>

          <h2>1. General Standard</h2>
          <p>
            Items listed on Decor Encore must be lawful, safe, accurately
            described, and appropriate for an event decor marketplace. Sellers
            are responsible for ensuring their listings comply with all laws,
            regulations, and platform policies.
          </p>

          <h2>2. Illegal, Stolen, or Unauthorized Items</h2>
          <p>You may not list items that are illegal, stolen, or unauthorized.</p>
          <ul>
            <li>Stolen goods or items suspected to be stolen</li>
            <li>Items obtained without permission</li>
            <li>Items that violate local, state, or federal law</li>
            <li>Items restricted from resale by contract or law</li>
            <li>Venue-owned, rental-company-owned, or borrowed property not yours to sell</li>
          </ul>

          <h2>3. Counterfeit or Infringing Items</h2>
          <p>
            You may not list counterfeit items, unauthorized replicas, or items
            that infringe intellectual property rights.
          </p>
          <ul>
            <li>Fake branded goods</li>
            <li>Unauthorized designer replicas</li>
            <li>Trademarked or copyrighted event materials without rights</li>
            <li>Unlicensed character decor, signage, or branded party goods</li>
            <li>Listings using another creator’s photos or designs without permission</li>
          </ul>

          <h2>4. Hazardous or Unsafe Items</h2>
          <p>
            Items that pose unreasonable safety risks are not allowed. Event decor
            must be safe for reasonable use.
          </p>
          <ul>
            <li>Damaged electrical decor or unsafe lighting</li>
            <li>Exposed wiring or faulty powered items</li>
            <li>Open-flame items that are unsafe or not properly disclosed</li>
            <li>Unstable structures, arches, stands, or backdrops</li>
            <li>Broken glass or sharp items not properly disclosed</li>
            <li>Items containing hazardous materials</li>
            <li>Items recalled by a manufacturer or government agency</li>
          </ul>

          <h2>5. Weapons, Drugs, and Regulated Goods</h2>
          <p>
            Decor Encore is not a marketplace for weapons, controlled substances,
            or regulated goods.
          </p>
          <ul>
            <li>Firearms, ammunition, or weapon accessories</li>
            <li>Explosives, fireworks, or pyrotechnics</li>
            <li>Controlled substances or drug paraphernalia</li>
            <li>Alcohol, tobacco, nicotine, or regulated consumables</li>
            <li>Medical devices or restricted health products</li>
          </ul>

          <h2>6. Adult, Hateful, or Harmful Content</h2>
          <p>
            Listings may not contain or promote hateful, explicit, violent,
            abusive, or exploitative material.
          </p>
          <ul>
            <li>Hate symbols or discriminatory content</li>
            <li>Explicit sexual content</li>
            <li>Graphic violence</li>
            <li>Harassing or threatening material</li>
            <li>Content exploiting minors or vulnerable people</li>
          </ul>

          <h2>7. Misleading or Deceptive Listings</h2>
          <p>
            Listings that mislead buyers are prohibited, even if the item itself
            might otherwise be allowed.
          </p>
          <ul>
            <li>Fake listings</li>
            <li>Photos that do not represent the item</li>
            <li>Incorrect quantity or bundle descriptions</li>
            <li>Hidden damage or missing pieces</li>
            <li>Incorrect condition labels</li>
            <li>Bait-and-switch listings</li>
            <li>Listings for items not actually available</li>
          </ul>

          <h2>8. Non-Decor or Off-Category Items</h2>
          <p>
            Decor Encore is focused on event decor and related event styling
            items. We may remove listings that do not fit the marketplace.
          </p>
          <p>Examples of items that may be removed include:</p>
          <ul>
            <li>General household goods unrelated to events</li>
            <li>Clothing or accessories not tied to event decor</li>
            <li>Personal services not supported by the platform</li>
            <li>Random resale inventory unrelated to celebrations or styling</li>
          </ul>

          <h2>9. Food, Perishables, and Consumables</h2>
          <p>
            Food, beverages, perishables, and consumables are generally not
            permitted unless Decor Encore later creates a specific supported
            category with additional rules.
          </p>

          <h2>10. Live Plants, Florals, and Organic Materials</h2>
          <p>
            Artificial florals and reusable event florals may be allowed. Live
            plants, fresh florals, or organic materials may be restricted or
            removed if they create safety, spoilage, pest, transport, or
            compliance concerns.
          </p>

          <h2>11. Services and Rentals</h2>
          <p>
            Decor Encore may support resale, rental, or service-related features
            in the future. Unless clearly supported, sellers should not list
            services, staffing, setup labor, rentals, or venue services as
            standard decor items.
          </p>

          <h2>12. Items Requiring Special Disclosure</h2>
          <p>
            Some items may be allowed only if accurately disclosed. Sellers must
            clearly identify defects, risks, missing parts, sizing issues, setup
            requirements, fragility, or special handling needs.
          </p>
          <ul>
            <li>Large arches, stands, or backdrops</li>
            <li>Glassware, mirrors, candles, or fragile decor</li>
            <li>Electrical or battery-powered decor</li>
            <li>Personalized signage</li>
            <li>Decor with visible wear or damage</li>
          </ul>

          <h2>13. Enforcement</h2>
          <p>
            Decor Encore may remove listings, limit visibility, request edits,
            suspend seller tools, restrict accounts, or terminate accounts if we
            believe this policy has been violated.
          </p>

          <p>
            We may also take action if an item creates legal, safety, reputational,
            or marketplace-quality concerns, even if it is not specifically
            listed in this policy.
          </p>

          <h2>14. Reporting Prohibited Items</h2>
          <p>
            Users may report listings they believe violate this policy. Decor
            Encore may review reports and take action at its discretion.
          </p>

          <h2>15. Updates to This Policy</h2>
          <p>
            We may update this Prohibited Items Policy from time to time.
            Continued use of Decor Encore after updates become effective means
            you accept the updated policy.
          </p>

          <h2>16. Contact</h2>
          <p>
            Questions about this policy may be sent to:{" "}
            <strong>[Insert Contact Email]</strong>
          </p>
        </div>
      </section>
    </main>
  )
}