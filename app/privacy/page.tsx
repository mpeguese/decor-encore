// app/privacy/page.tsx
import styles from "@/app/auth-flow.module.css"
import Link from "next/link"

export default function PrivacyPage() {
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
          <h1>Privacy Policy</h1>
          <p>Effective Date: [Insert Date]</p>
        </div>

        <div className="legal-content">
          <p>
            This Privacy Policy explains how Decor Encore collects, uses,
            shares, stores, and protects information when you use our website,
            marketplace, mobile experiences, listing tools, messaging tools,
            seller features, buyer features, and related services.
          </p>

          <p>
            By using Decor Encore, you agree to the collection and use of
            information as described in this Privacy Policy.
          </p>

          <h2>1. Information We Collect</h2>
          <p>
            We collect information you provide directly, information generated
            through your use of the platform, and information we receive from
            service providers or third-party tools used to operate Decor Encore.
          </p>

          <h2>2. Account Information</h2>
          <p>
            When you create or update an account, we may collect your name, email
            address, phone number, ZIP code, profile information, seller status,
            login information, and other information needed to operate your
            account.
          </p>

          <h2>3. Listing and Seller Information</h2>
          <p>
            When you create listings, we may collect listing titles,
            descriptions, photos, categories, prices, quantities, condition,
            color, style, fulfillment preferences, pickup city, pickup state,
            pickup ZIP code, and related listing details.
          </p>

          <p>
            Listing information may be visible to other users and may appear in
            marketplace search results, listing pages, saved listings, messages,
            or promotional placements.
          </p>

          <h2>4. Location Information</h2>
          <p>
            Decor Encore may collect ZIP code information from buyers and sellers
            to support marketplace functionality, including nearby listings,
            distance estimates, radius filters, and location-based discovery.
          </p>

          <p>
            We may convert ZIP codes into approximate latitude and longitude
            coordinates. These coordinates are used to estimate distance between
            users and listings. We do not intend to display exact home addresses
            publicly.
          </p>

          <h2>5. Transaction and Activity Information</h2>
          <p>
            We may collect information about listings viewed, searches,
            favorites, saved listings, messages, inquiries, seller activity,
            buyer activity, listing creation, listing edits, profile updates,
            and other platform interactions.
          </p>

          <h2>6. Communications</h2>
          <p>
            If you send messages, inquiries, support requests, reports, or other
            communications through Decor Encore, we may collect and store those
            communications to operate the platform, provide support, enforce
            policies, prevent fraud, and improve safety.
          </p>

          <h2>7. Payment Information</h2>
          <p>
            If payment features are introduced, payment information may be
            collected and processed by third-party payment providers such as
            Stripe. Decor Encore may receive limited payment-related information,
            such as transaction status, payout status, fees, refund status,
            dispute information, or payment identifiers.
          </p>

          <p>
            We do not intend to store full payment card numbers on our own
            servers.
          </p>

          <h2>8. Device, Usage, and Technical Information</h2>
          <p>
            We may collect technical information such as IP address, browser
            type, device type, operating system, referring pages, pages viewed,
            session activity, timestamps, approximate location derived from IP,
            crash data, and performance data.
          </p>

          <h2>9. Cookies and Similar Technologies</h2>
          <p>
            Decor Encore may use cookies, local storage, pixels, analytics tools,
            and similar technologies to keep users signed in, remember
            preferences, measure performance, understand usage, improve features,
            prevent fraud, and support marketing or analytics.
          </p>

          <h2>10. How We Use Information</h2>
          <p>We may use information to:</p>
          <ul>
            <li>Operate, maintain, and improve Decor Encore</li>
            <li>Create and manage user accounts</li>
            <li>Display listings and marketplace results</li>
            <li>Support nearby and radius-based discovery</li>
            <li>Enable buyer and seller communication</li>
            <li>Provide customer support</li>
            <li>Prevent fraud, abuse, spam, and unsafe activity</li>
            <li>Enforce our Terms and policies</li>
            <li>Analyze platform performance and user behavior</li>
            <li>Develop new features and services</li>
            <li>Send service updates, notices, and transactional messages</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>11. How Information Is Shared</h2>
          <p>
            We may share information with other users when necessary to operate
            the marketplace. For example, listing details are visible to buyers,
            and certain account or communication details may be shared when users
            interact.
          </p>

          <p>
            We may also share information with service providers that help us
            operate the platform, including hosting providers, database
            providers, analytics providers, email providers, payment processors,
            fraud prevention providers, storage providers, and customer support
            tools.
          </p>

          <h2>12. Legal and Safety Sharing</h2>
          <p>
            We may disclose information if we believe it is reasonably necessary
            to comply with law, legal process, or government requests; enforce
            our Terms; investigate fraud or safety concerns; protect the rights,
            property, or safety of Decor Encore, users, or others; or respond to
            disputes.
          </p>

          <h2>13. Business Transfers</h2>
          <p>
            If Decor Encore is involved in a merger, acquisition, financing,
            reorganization, sale of assets, or similar transaction, information
            may be transferred as part of that transaction, subject to applicable
            law.
          </p>

          <h2>14. Data Retention</h2>
          <p>
            We retain information for as long as reasonably necessary to operate
            the platform, provide services, comply with legal obligations,
            resolve disputes, enforce agreements, prevent fraud, and maintain
            business records.
          </p>

          <p>
            Some information may remain in backups, logs, transaction records,
            dispute records, fraud prevention records, or legal compliance
            records even after account deletion.
          </p>

          <h2>15. Security</h2>
          <p>
            We use reasonable administrative, technical, and organizational
            measures to protect information. However, no system is completely
            secure, and we cannot guarantee absolute security of information.
          </p>

          <h2>16. Your Choices</h2>
          <p>
            You may update certain profile information through your account. You
            may also contact us to request account deletion or ask questions
            about your information.
          </p>

          <p>
            Some features may not work properly if certain information is missing.
            For example, nearby listings and radius filters may require a valid
            ZIP code.
          </p>

          <h2>17. Marketing Communications</h2>
          <p>
            If Decor Encore sends marketing communications, you may opt out where
            required by law. Transactional, account, safety, legal, or service
            messages may still be sent even if you opt out of marketing.
          </p>

          <h2>18. Children’s Privacy</h2>
          <p>
            Decor Encore is not intended for children under 13. We do not
            knowingly collect personal information from children under 13.
          </p>

          <h2>19. State Privacy Rights</h2>
          <p>
            Depending on your location, you may have rights to access, correct,
            delete, or request information about certain personal data. We will
            respond to requests as required by applicable law.
          </p>

          <h2>20. International Users</h2>
          <p>
            Decor Encore is operated from the United States. If you access the
            platform from outside the United States, you understand that your
            information may be processed in the United States or other locations
            where our providers operate.
          </p>

          <h2>21. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. If we make
            material changes, we may provide notice through the platform or by
            other reasonable means. Continued use of Decor Encore after the
            updated policy becomes effective means you accept the updated policy.
          </p>

          <h2>22. Contact</h2>
          <p>
            Questions about this Privacy Policy may be sent to:{" "}
            <strong>[Insert Contact Email]</strong>
          </p>
        </div>
      </section>
    </main>
  )
}