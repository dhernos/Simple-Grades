// src/app/page.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import SessionTTL from "@/components/SessionTTL";

// Definiere einen Typ für die zusätzlichen Session-Daten, die wir vom Backend holen
interface SessionInfo {
  expires: string;
  loginTime: string;
  role: string;
  ttlInSeconds: number;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loadingSessionInfo, setLoadingSessionInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Session-Fehler, die der JWT-Callback setzen könnte
  useEffect(() => {
    if (session?.error) {
      setError(
        "Ihre Sitzung ist abgelaufen oder ungültig. Bitte melden Sie sich erneut an."
      );
      // Optionale, automatische Abmeldung
      // signOut({ callbackUrl: "/login?error=InvalidSessionError" });
    } else {
      setError(null);
    }
  }, [session]);

  // Funktion zum Abrufen der Session-Details von deiner neuen API
  // Dies würde die tatsächlichen TTLs aus Redis holen
  const fetchSessionDetails = async () => {
    setLoadingSessionInfo(true);
    setError(null);
    try {
      const response = await fetch("/api/sessions/current");
      if (!response.ok) {
        throw new Error("Fehler beim Abrufen der Session-Details.");
      }
      const data = await response.json();
      setSessionInfo(data);
    } catch (err) {
      console.error(err);
      setError("Konnte Session-Details nicht laden.");
    } finally {
      setLoadingSessionInfo(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  if (status === "loading") {
    return <p className="p-8 text-center">Lade Session...</p>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-8">
      <h1 className="mb-8 text-4xl font-bold">Willkommen im Next.js Template!</h1>

      {session ? (
        <div className="rounded-lg bg-white p-8 shadow-md text-center max-w-xl w-full">
          <p className="mb-4 text-lg">
            Angemeldet als: <span className="font-semibold">{session.user?.email}</span>
            {session.user?.role && (
              <span className="ml-2 text-sm text-gray-500">({session.user.role})</span>
            )}
          </p>

          <p className="mb-4 text-lg">
            Session gültig bis:{" "}
            <span className="font-semibold">
              {session.expires
                ? new Date(session.expires).toLocaleString()
                : "Unbekannt"}
            </span>
          </p>

          {/* Anzeigen des Fehlers, wenn vorhanden */}
          {error && (
            <p className="mb-4 mt-4 text-center text-red-600 font-bold">
              Fehler: {error}
            </p>
          )}

          {/* Buttons zum Abrufen und Anzeigen der Redis-Session-Informationen */}
          <div className="mt-6">
            <h2 className="mb-2 text-xl font-bold">Redis Session-Details</h2>
            <button
              onClick={fetchSessionDetails}
              disabled={loadingSessionInfo}
              className="rounded-md bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600 disabled:opacity-50 cursor-pointer"
            >
              {loadingSessionInfo ? "Lade..." : "Details der Redis-Session anzeigen"}
            </button>

            {sessionInfo && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md text-left border border-gray-200">
                <p>
                  <span className="font-semibold">Login Zeit:</span>{" "}
                  {new Date(parseInt(sessionInfo.loginTime)).toLocaleString()}
                </p>
                <p>
                  <span className="font-semibold">Ablaufdatum:</span>{" "}
                  {new Date(parseInt(sessionInfo.expires)).toLocaleString()}
                </p>
                  <SessionTTL ttlInSeconds={sessionInfo.ttlInSeconds} />
              </div>
            )}
          </div>

          <button
            onClick={handleSignOut}
            className="mt-6 rounded-md bg-red-500 px-6 py-3 font-bold text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 cursor-pointer"
          >
            Abmelden
          </button>
        </div>
      ) : (
        <div className="text-center">
          <p className="mb-4 text-lg">Sie sind nicht angemeldet.</p>
          <Link
            href="/login"
            className="rounded-md bg-blue-500 px-6 py-3 font-bold text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 cursor-pointer"
          >
            Anmelden
          </Link>
          <Link
            href="/signup"
            className="ml-4 rounded-md bg-purple-500 px-6 py-3 font-bold text-white hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 cursor-pointer"
          >
            Registrieren
          </Link>
        </div>
      )}
    </div>
  );
}