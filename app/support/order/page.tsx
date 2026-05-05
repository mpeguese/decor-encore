// app/support/order/page.tsx
import { Suspense } from "react"
import SupportOrderClient from "./SupportOrderClient"
import styles from "@/app/seller/orders/seller-orders.module.css"

export default function SupportOrderPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.sellerOrdersPage}>
          <section className={styles.stateCard}>
            <h2>Loading support</h2>
            <p>Getting order help details.</p>
          </section>
        </main>
      }
    >
      <SupportOrderClient />
    </Suspense>
  )
}