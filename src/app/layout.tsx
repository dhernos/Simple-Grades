// src/app/layout.tsx

import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Providers } from "./providers"

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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}