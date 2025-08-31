"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from 'next/navigation';

export default function LogOut() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Greife auf session.user.sessionId zu, nicht auf session.sessionId
    if (status === "authenticated" && session?.user?.sessionId) {
      const handleLogout = async () => {
        try {
          const response = await fetch('/api/sessions', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: session.user.sessionId }), // Korrekter Zugriffspfad
          });

          if (response.ok) {
            console.log('Redis session deleted successfully.');
          } else {
            console.error('Failed to delete Redis key on the server.');
          }
        } catch (error) {
          console.error('An error occurred during API call:', error);
        } finally {
          await signOut({ callbackUrl: "/login" });
        }
      };

      handleLogout();
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-xl">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="text-xl">You are being logged out...</h1>
    </div>
  );
}