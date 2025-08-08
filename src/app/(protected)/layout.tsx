// src/app/dashboard/layout.tsx

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingPage from '@/components/loading-page'; // Eine einfache Lade-Komponente

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Wenn die Session ungültig wird, leiten wir um
    if (status === "unauthenticated" || session?.error) {
      console.log("ProtectedLayout: Session invalid, redirecting.");
      router.push("/logout");
    }
  }, [status, session?.error, router]);

  // Zeige eine Lade-Seite, solange der Status noch nicht geklärt ist
  if (status === "loading") {
    return <LoadingPage />;
  }

  // Render die Seite nur, wenn der User authentifiziert ist
  if (status === "authenticated") {
    return <>{children}</>;
  }

  // Standard-Fall, falls etwas nicht stimmt (wird selten erreicht)
  return null;
}