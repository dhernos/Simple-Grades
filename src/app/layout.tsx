// Copyright (C) 2025 github.com/dhernos
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// src/app/layout.tsx

import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Simple Grades",
  description: "Your Grades and timtable made easy.",
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