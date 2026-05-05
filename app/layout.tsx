import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Decor Encore",
  description: "Buy and sell once-loved event decor.",
   icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
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
