// src/app/providers.tsx
"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>
    <ThemeProvider
      enableSystem
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      >
    {children}
    </ThemeProvider>
  </SessionProvider>
}