import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Providers } from "./providers" // Importiere Providers

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "NextAuth.js Template",
  description: "Next.js template with NextAuth.js, App Router, Prisma and JWT.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers> {/* Umschließe children mit Providers */}
          {children}
        </Providers>
      </body>
    </html>
  )
}