// app/reviews/order/page.tsx
import { Suspense } from "react"
import ReviewOrderClient from "./ReviewOrderClient"
import styles from "@/app/seller/orders/seller-orders.module.css"

export default function ReviewOrderPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.sellerOrdersPage}>
          <section className={styles.stateCard}>
            <h2>Loading review</h2>
            <p>Getting order review details.</p>
          </section>
        </main>
      }
    >
      <ReviewOrderClient />
    </Suspense>
  )
}