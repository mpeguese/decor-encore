// app/admin/page.tsx
import Link from "next/link"
import { requireAdmin } from "@/app/lib/admin/requireAdmin"
import styles from "./admin.module.css"

export default async function AdminDashboardPage() {
  const { admin } = await requireAdmin("/admin")

  if (!admin) {
    return (
      <main className={styles.adminPage}>
        <section className={styles.adminShell}>
          <header className={styles.adminHeader}>
            <strong className={styles.adminBrand}>Decor Encore</strong>
            <Link href="/admin/login">Admin login</Link>
          </header>

          <div className={styles.accessDenied}>
            <h2>Access denied</h2>
            <p>
              This account is signed in, but it does not have active Decor Encore
              admin access.
            </p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={styles.adminPage}>
      <section className={styles.adminShell}>
        <header className={styles.adminHeader}>
          <Link href="/" aria-label="Public site">
            Public site
          </Link>

          <strong className={styles.adminBrand}>Decor Encore Admin</strong>

          <Link href="/admin/login">Switch user</Link>
        </header>

        <section className={styles.adminHero}>
          <p>Internal dashboard</p>
          <h1>Admin center</h1>
          <span>
            Review support issues, orders, listings, reports, and operational
            tasks for Decor Encore.
          </span>
        </section>

        <section className={styles.adminGrid}>
          <Link href="/admin/support" className={styles.adminCard}>
            <span>Support</span>
            <strong>Queue</strong>
            <p>Review cancellation requests, order issues, and buyer/seller help.</p>
          </Link>

          <Link href="/admin/orders" className={styles.adminCard}>
            <span>Orders</span>
            <strong>Review</strong>
            <p>Look up order status, payment, shipping, fulfillment, and timeline data.</p>
          </Link>

          <Link href="/admin/listings" className={styles.adminCard}>
            <span>Moderation</span>
            <strong>Listings</strong>
            <p>Review reported listings, removed items, and marketplace quality issues.</p>
          </Link>
        </section>
      </section>
    </main>
  )
}