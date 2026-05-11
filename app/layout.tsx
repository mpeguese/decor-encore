import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://decor-encore.com"),

  title: {
    default: "Decor Encore | Buy & Sell Once-Loved Event Decor",
    template: "%s | Decor Encore",
  },

  description:
    "Decor Encore is a marketplace for buying and selling once-loved event decor for weddings, baby showers, birthdays, graduations, quinceañeras, holidays, and more.",

  manifest: "/site.webmanifest",

  keywords: [
    "event decor marketplace",
    "wedding decor",
    "baby shower decor",
    "party decor",
    "quinceañera decor",
    "graduation decor",
    "birthday decor",
    "used event decor",
    "buy event decor",
    "sell event decor",
    "once-loved decor",
  ],

  openGraph: {
    title: "Decor Encore | Buy & Sell Once-Loved Event Decor",
    description:
      "A marketplace for once-loved event decor. Buy, sell, and inspire the next celebration.",
    url: "https://decor-encore.com",
    siteName: "Decor Encore",
    images: [
      {
        url: "/images/decor-encore-og.png",
        width: 1200,
        height: 630,
        alt: "Decor Encore - A marketplace for once-loved event decor",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Decor Encore | Buy & Sell Once-Loved Event Decor",
    description:
      "A marketplace for once-loved event decor. Buy, sell, and inspire the next celebration.",
    images: ["/images/decor-encore-og.png"],
  },

  alternates: {
    canonical: "https://decor-encore.com",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
