"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "./faq.module.css";
import AppBottomNav from "../components/AppBottomNav";

type FAQCategory =
  | "General"
  | "Buying"
  | "Selling"
  | "Payments"
  | "Messaging & Safety"
  | "Orders";

type FAQItem = {
  id: string;
  category: FAQCategory;
  question: string;
  answer: string;
};

const categories: Array<"All" | FAQCategory> = [
  "All",
  "General",
  "Buying",
  "Selling",
  "Payments",
  "Messaging & Safety",
  "Orders",
];

const faqs: FAQItem[] = [
  {
    id: "what-is-decor-encore",
    category: "General",
    question: "What is Decor Encore?",
    answer:
      "Decor Encore is a marketplace for buying and selling once-loved event decor. It helps people find beautiful pieces for weddings, baby showers, birthdays, quinceañeras, and other celebrations while giving sellers a simple way to pass along decor they no longer need.",
  },
  {
    id: "is-decor-encore-a-rental-platform",
    category: "General",
    question: "Is Decor Encore a rental platform?",
    answer:
      "No. Decor Encore is not a rental platform. It is a marketplace where people can buy and sell event decor. Items listed on Decor Encore are intended for purchase, not temporary rental.",
  },
  {
    id: "what-can-be-listed",
    category: "General",
    question: "What kind of decor can be listed?",
    answer:
      "Sellers can list event decor such as centerpieces, table decor, signs, backdrops, arches, faux florals, candles, ceremony decor, lighting, card boxes, display pieces, and other celebration-related items. Listings should be event-focused and accurately described.",
  },
  {
    id: "who-can-use-decor-encore",
    category: "General",
    question: "Who can use Decor Encore?",
    answer:
      "Decor Encore is for anyone planning an event, recently finished an event, or looking to give once-loved decor another celebration. Buyers can browse for pieces that fit their vision, and sellers can list decor they are ready to pass on.",
  },

  {
    id: "how-do-i-buy",
    category: "Buying",
    question: "How do I buy an item?",
    answer:
      "Browse the marketplace, open a listing to review the details, message the seller if you have questions, and complete checkout through Decor Encore. After purchase, your order will appear in your account so you can track its status.",
  },
  {
    id: "can-i-message-before-buying",
    category: "Buying",
    question: "Can I message a seller before buying?",
    answer:
      "Yes. Buyers can message sellers through Decor Encore to ask questions about an item before purchasing. Keeping communication inside Decor Encore helps both sides stay organized and gives support better visibility if help is needed.",
  },
  {
    id: "what-should-i-check-before-buying",
    category: "Buying",
    question: "What should I check before buying decor?",
    answer:
      "Review the photos, description, condition, quantity, size details, pickup or shipping options, and seller notes. If anything is unclear, message the seller before completing checkout.",
  },
  {
    id: "can-i-save-items",
    category: "Buying",
    question: "Can I save items I like?",
    answer:
      "Yes. You can favorite listings so they are easier to find later. This is helpful when comparing decor options or planning the overall look for your event.",
  },

  {
    id: "how-do-i-sell",
    category: "Selling",
    question: "How do I sell my decor?",
    answer:
      "Create an account, add your listing details, upload clear photos, set your price, choose fulfillment options, and publish the listing. Once published, buyers can find your decor in the marketplace and message you with questions.",
  },
  {
    id: "can-i-sell-wedding-decor",
    category: "Selling",
    question: "Can I sell decor from my wedding or event?",
    answer:
      "Yes. That is exactly what Decor Encore was designed for. Instead of letting beautiful decor sit in storage, you can list it for someone else’s upcoming celebration.",
  },
  {
    id: "what-makes-a-good-listing",
    category: "Selling",
    question: "What makes a good listing?",
    answer:
      "A strong listing includes clear photos, an honest condition description, accurate quantity, helpful dimensions if available, pickup or shipping details, and a fair price. The more complete your listing is, the easier it is for buyers to feel confident.",
  },
  {
    id: "can-i-pause-listing",
    category: "Selling",
    question: "Can I pause or remove a listing?",
    answer:
      "Yes. Sellers can manage listings from their account. If an item is no longer available, you should pause or remove it so buyers do not try to purchase something you can no longer fulfill.",
  },
  {
    id: "seller-responsibility-for-accurate-listings",
    category: "Selling",
    question: "What are sellers responsible for?",
    answer:
      "Sellers are responsible for keeping listings accurate, available, and fulfillable. If an item is unavailable, materially different from the listing, or cannot be fulfilled as agreed, Decor Encore may review the order and may issue a full or partial refund to the buyer.",
  },

  {
    id: "how-payments-work",
    category: "Payments",
    question: "How do payments work?",
    answer:
      "Payments are completed through Decor Encore using secure checkout. This keeps the order tied to the listing, creates a clear purchase record, and helps support review the transaction if an issue comes up.",
  },
  {
    id: "when-do-sellers-get-paid",
    category: "Payments",
    question: "When do sellers get paid?",
    answer:
      "Seller payouts are handled through Stripe. Timing can depend on the seller’s connected Stripe account, payout eligibility, order status, and Stripe’s processing timeline. Decor Encore is designed to keep the process as smooth as possible while maintaining a clear order record.",
  },
  {
    id: "why-checkout-inside-platform",
    category: "Payments",
    question: "Why should checkout stay inside Decor Encore?",
    answer:
      "Keeping checkout inside Decor Encore helps protect the buyer and seller by maintaining a clear record of the listing, payment, order status, and communication. Off-platform payments can make it harder to confirm what happened if support is needed.",
  },
  {
    id: "does-decor-encore-charge-fees",
    category: "Payments",
    question: "Does Decor Encore charge a platform fee?",
    answer:
      "Decor Encore may apply a platform fee to support secure checkout, marketplace tools, order tracking, seller features, and customer support. Any applicable costs should be reviewed during the checkout or seller flow.",
  },
  {
    id: "refund-policy",
    category: "Payments",
    question: "What is Decor Encore’s refund policy?",
    answer:
      "Decor Encore reviews refund requests based on the order details, listing accuracy, seller fulfillment, buyer communication, and any support request submitted through the platform. If an order cannot be completed because of a seller issue, item availability problem, or another order-related issue, Decor Encore may issue a full or partial refund to the buyer’s original payment method. Refunds are not automatic for buyer change-of-mind situations, missed pickup arrangements, or issues caused by incomplete communication. These situations are reviewed case by case.",
  },
  {
    id: "how-long-refund-takes",
    category: "Payments",
    question: "How long does a refund take?",
    answer:
      "Once Decor Encore issues a refund, it is submitted back to the buyer’s original payment method. The time it takes to appear depends on the buyer’s bank or card issuer and may take a few business days.",
  },
  {
    id: "partial-refunds",
    category: "Payments",
    question: "Can partial refunds be issued?",
    answer:
      "Yes. Decor Encore may issue a partial refund when only part of an order is affected, when support approves an adjustment, or when a full refund is not required based on the order details. Partial refunds are reviewed case by case and are tied to the order record.",
  },
  {
    id: "seller-payout-after-refund",
    category: "Payments",
    question: "What happens to the seller payout if a refund is issued?",
    answer:
      "If a buyer is refunded, the seller payout or transfer connected to that order may be reversed, reduced, delayed, or adjusted by Stripe based on the refund amount and payment structure. For full refunds, the seller payout may be fully reversed. For partial refunds, the seller payout may be reduced based on the refunded amount.",
  },
  {
    id: "platform-fee-refunds",
    category: "Payments",
    question: "Are platform fees refunded?",
    answer:
      "Platform fees may be refunded when Decor Encore determines that a seller, item, fulfillment, or order issue caused the refund. Platform fees are not automatically refunded for buyer-caused issues, buyer change-of-mind situations, missed pickup arrangements, or courtesy adjustments unless Decor Encore approves otherwise.",
  },

  {
    id: "why-message-inside-platform",
    category: "Messaging & Safety",
    question: "Why should messages stay inside Decor Encore?",
    answer:
      "Messages should stay inside Decor Encore so buyers and sellers have a clear conversation history tied to the listing or order. This helps reduce confusion and gives support better context if help is needed later.",
  },
  {
    id: "why-block-contact-info",
    category: "Messaging & Safety",
    question: "Why are phone numbers, emails, or outside payment apps blocked in messages?",
    answer:
      "Decor Encore may block certain off-platform contact or payment details to help protect buyers and sellers. Keeping communication and payments on-platform supports safer transactions, clearer records, and a better support experience.",
  },
  {
    id: "can-i-report-listing",
    category: "Messaging & Safety",
    question: "Can I report a listing or message?",
    answer:
      "Yes. If something looks inaccurate, suspicious, inappropriate, or outside the spirit of Decor Encore, you can report it so the platform can review it.",
  },
  {
    id: "how-to-stay-safe",
    category: "Messaging & Safety",
    question: "How can I stay safe when buying or selling?",
    answer:
      "Use Decor Encore messaging, complete payment through the platform, review listing details carefully, be honest about item condition, and avoid moving communication or payment outside the platform.",
  },

  {
    id: "what-happens-after-purchase",
    category: "Orders",
    question: "What happens after I purchase an item?",
    answer:
      "After checkout, your order will appear in your account. You can review the order details, follow status updates, and message the seller if needed.",
  },
  {
    id: "pickup-or-shipping",
    category: "Orders",
    question: "How does pickup or shipping work?",
    answer:
      "Sellers choose the fulfillment options available for each listing. Some items may be pickup only, while others may offer shipping. Buyers should review the listing details before purchasing.",
  },
  {
    id: "what-if-order-problem",
    category: "Orders",
    question: "What if I have a problem with an order?",
    answer:
      "If there is an issue with an order, use the order help area from your account. Keeping the order, payment, and messages inside Decor Encore gives support the clearest view of what happened and helps both buyers and sellers resolve issues more confidently.",
  },
  {
    id: "how-order-tracking-works",
    category: "Orders",
    question: "How does order tracking work?",
    answer:
      "Decor Encore keeps a timeline of important order updates, such as when an order is placed, accepted, ready for pickup, picked up, completed, canceled, or refunded. This helps both buyers and sellers understand where the order stands.",
  },
  {
    id: "does-refund-relist-item",
    category: "Orders",
    question: "Does a refunded item automatically go back for sale?",
    answer:
      "No. A refund does not automatically relist an item. The listing remains sold unless the seller or Decor Encore determines that the item is still available and appropriate to list again. This helps prevent unavailable, damaged, or disputed items from returning to the marketplace accidentally.",
  },
  {
    id: "why-keep-order-details-inside-platform",
    category: "Orders",
    question: "Why should order details stay inside Decor Encore?",
    answer:
      "Keeping order communication, support requests, payment records, and fulfillment updates inside Decor Encore gives support the clearest view of what happened if a problem comes up. Off-platform communication or payment can make it harder to review an issue fairly.",
  },
];

export default function FAQPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"All" | FAQCategory>(
    "All"
  );
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);

  const filteredFaqs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return faqs.filter((faq) => {
      const matchesCategory =
        activeCategory === "All" || faq.category === activeCategory;

      const matchesSearch =
        normalizedQuery.length === 0 ||
        faq.question.toLowerCase().includes(normalizedQuery) ||
        faq.answer.toLowerCase().includes(normalizedQuery) ||
        faq.category.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesSearch;
    });
  }, [query, activeCategory]);

  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlowOne} />
      <div className={styles.backgroundGlowTwo} />

      <section className={styles.shell}>
        <header className={styles.header}>
          {/* <Link href="/" className={styles.backLink}>
            ← Back to Decor Encore
          </Link> */}

          <div className={styles.heroCard}>
            <p className={styles.eyebrow}>Frequently Asked Questions</p>
            {/* <h1>Frequently Asked Questions</h1> */}
            <p className={styles.heroText}>
              Find quick answers about buying, selling, payments, messaging,
              and orders on Decor Encore.
            </p>

            <div className={styles.searchWrap}>
              <span className={styles.searchIcon} aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M10.75 18.5C15.03 18.5 18.5 15.03 18.5 10.75C18.5 6.47 15.03 3 10.75 3C6.47 3 3 6.47 3 10.75C3 15.03 6.47 18.5 10.75 18.5Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16.25 16.25L21 21"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className={styles.searchInput}
                placeholder="Search payments, refunds, pickup, selling, messages..."
                aria-label="Search frequently asked questions"
              />

              {query.trim().length > 0 ? (
                <button
                  type="button"
                  className={styles.clearSearch}
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        </header>

        <section className={styles.categoryBar} aria-label="FAQ categories">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`${styles.categoryPill} ${
                activeCategory === category ? styles.categoryPillActive : ""
              }`}
              onClick={() => {
                setActiveCategory(category);
                setOpenId(null);
              }}
            >
              {category}
            </button>
          ))}
        </section>

        <section className={styles.contentGrid}>
          <aside className={styles.sideCard}>
            <p className={styles.sideLabel}>Quick Guide</p>
            <h2>Decor that gets a second celebration.</h2>
            <p>
              Decor Encore helps buyers find event decor and helps sellers give
              once-loved pieces a new moment.
            </p>

            <div className={styles.sideDivider} />

            <p className={styles.sideSmall}>
              Still need help? Visit your order help area from your account if
              your question is about a specific purchase or sale.
            </p>
          </aside>

          <div className={styles.faqList}>
            <div className={styles.resultMeta}>
              <span>
                {filteredFaqs.length}{" "}
                {filteredFaqs.length === 1 ? "answer" : "answers"} found
              </span>

              {activeCategory !== "All" ? (
                <button
                  type="button"
                  onClick={() => setActiveCategory("All")}
                  className={styles.resetButton}
                >
                  View all
                </button>
              ) : null}
            </div>

            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq) => {
                const isOpen = openId === faq.id;

                return (
                  <article
                    key={faq.id}
                    className={`${styles.faqCard} ${
                      isOpen ? styles.faqCardOpen : ""
                    }`}
                  >
                    <button
                      type="button"
                      className={styles.faqQuestion}
                      onClick={() => setOpenId(isOpen ? null : faq.id)}
                      aria-expanded={isOpen}
                    >
                      <span>
                        <span className={styles.faqCategory}>
                          {faq.category}
                        </span>
                        <strong>{faq.question}</strong>
                      </span>

                      <span
                        className={`${styles.faqToggle} ${
                          isOpen ? styles.faqToggleOpen : ""
                        }`}
                        aria-hidden="true"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M12 5V19"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                          <path
                            d="M5 12H19"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                    </button>

                    <div
                      className={`${styles.answerWrap} ${
                        isOpen ? styles.answerWrapOpen : ""
                      }`}
                    >
                      <p>{faq.answer}</p>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyIcon}>⌕</p>
                <h2>No answers found</h2>
                <p>
                  Try searching for another word like “payment,” “refund,”
                  “pickup,” “seller,” “messages,” or “order.”
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setActiveCategory("All");
                    setOpenId(faqs[0]?.id ?? null);
                  }}
                >
                  Reset FAQ
                </button>
              </div>
            )}
          </div>
        </section>
      </section>
      <AppBottomNav
        active="faq"
        items={[
          {
            key: "shop",
            label: "Shop",
            href: "/marketplace",
          },
          {
            key: "faq",
            label: "FAQ",
            href: "/faq",
          },
          {
            key: "profile",
            label: "Profile",
            href: "/profile",
          },
        ]}
      />
    </main>
  );
}