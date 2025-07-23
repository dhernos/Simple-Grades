// src/app/page.tsx
"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { useEffect } from "react"; // useEffect für potenzielle Fehlerbehandlung

export default function Home() {
  const { data: session, status, update } = useSession(); // `update` Funktion vom Hook

  // Effekt, um auf Session-Fehler zu reagieren
  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      console.error("Refresh Token Fehler: Session abgelaufen oder ungültig.");
      // Optional: Automatische Abmeldung oder Weiterleitung zur Login-Seite
      // signOut({ callbackUrl: "/login?error=RefreshAccessTokenError" });
    }
  }, [session]); // Abhängigkeit von der Session

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  // Funktion zum Aktualisieren der Session mit `rememberMe`
  // Diese Funktion sendet den 'rememberMe'-Wert an den 'session'-Callback
  // in [...nextauth]/route.ts, der dann wiederum den 'jwt'-Callback triggert.
  // Es beeinflusst NICHT direkt die Refresh Token Dauer nach dem Login.
  // Die Dauer des Refresh Tokens wird beim LOGIN gesetzt und in der DB gespeichert.
  // Diese 'update'-Funktion kann dazu dienen, andere Session-Daten zu aktualisieren,
  // aber nicht die bereits in der DB gespeicherte Refresh-Token-Dauer.
  // Um die Refresh Token Dauer zu ändern, müsste sich der Benutzer neu anmelden.
  // Ich belasse die Buttons hier zur Demonstration der 'update'-Funktionalität,
  // falls du andere Session-Daten darüber aktualisieren möchtest.
  // Für das Refresh Token ist die rememberMe-Einstellung beim Anmelden entscheidend.
  const handleRememberMeUpdate = async (value: boolean) => {
    // Die 'update' Funktion kann verwendet werden, um Daten *innerhalb* der Session zu aktualisieren,
    // die dann über den Session-Callback zurück in den JWT gelangen.
    // Dies beeinflusst NICHT die Lebensdauer des Refresh Tokens in der Datenbank,
    // die beim Login gesetzt wird. Die Session-MaxAge im Cookie wird durch diese Updates beeinflusst.
    await update({ rememberMe: value });
    console.log(`Session 'rememberMe' status updated to: ${value}`);
    // Ein erneuter Aufruf von useSession() oder eine manuelle Aktualisierung ist nötig,
    // um die Änderungen in der UI zu sehen, wenn sie vom Server zurückkommen.
    // Ein update() call triggert oft eine Revalidierung der Session.
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
              {session.expires ? new Date(session.expires).toLocaleString() : "Unbekannt"}
            </span>
          </p>

          <p className="mb-2 text-md">
            **Access Token:**{" "}
            <span className="font-mono text-sm break-all">
              {session.accessToken ? session.accessToken.substring(0, 30) + "..." : "Nicht verfügbar"}
            </span>
          </p>
          <p className="mb-2 text-md">
            **Access Token läuft ab:**{" "}
            <span className="font-semibold">
              {session.accessTokenExpires
                ? new Date(session.accessTokenExpires).toLocaleString()
                : "N/A"}
            </span>
          </p>
          <p className="mb-2 text-md">
            **Refresh Token:**{" "}
            <span className="font-mono text-sm break-all">
              {session.refreshToken ? session.refreshToken.substring(0, 30) + "..." : "Nicht verfügbar"}
            </span>
          </p>
          <p className="mb-2 text-md">
            **Refresh Token läuft ab:**{" "}
            <span className="font-mono text-sm break-all">
              {session.refreshTokenExpires
                ? new Date(session.refreshTokenExpires).toLocaleString()
                : "N/A"}
            </span>
          </p>

          {session.error && (
            <p className="mb-4 mt-4 text-center text-red-600 font-bold">
              Fehler: {session.error === "RefreshAccessTokenError" ? "Ihre Sitzung ist abgelaufen oder ungültig. Bitte melden Sie sich erneut an." : session.error}
            </p>
          )}

          {/* Hinweis: Diese Buttons ändern NICHT die Lebensdauer des Refresh Tokens in der DB.
              Sie zeigen die Nutzung der 'update' Funktion, um Session-Daten zu beeinflussen,
              was das Cookie-MaxAge der NextAuth Session beeinflussen könnte,
              aber nicht die Langlebigkeit des Refresh Tokens selbst.
              Die rememberMe-Einstellung wird beim LOGIN festgelegt.
          */}
          <div className="mb-4 mt-6">
             <p className="mb-2 text-sm text-gray-600">
               *Hinweis: Diese Buttons aktualisieren den 'rememberMe'-Status im Session-Cookie und JWT,
               beeinflussen aber nicht die bereits festgelegte Lebensdauer des Refresh Tokens in der Datenbank.
               Dafür ist die "Angemeldet bleiben"-Checkbox beim Login zuständig.*
            </p>
            <button
              onClick={() => handleRememberMeUpdate(true)}
              className="mr-2 rounded-md bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-600 disabled:opacity-50"
              disabled={status !== "authenticated"}>Session auf "Angemeldet bleiben" setzen</button>
            <button
              onClick={() => handleRememberMeUpdate(false)}
              className="rounded-md bg-yellow-500 px-4 py-2 font-bold text-white hover:bg-yellow-600 disabled:opacity-50"
              disabled={status !== "authenticated"}
            >
              Session auf "Nur diese Sitzung" setzen
            </button>
          </div>

          <button
            onClick={handleSignOut}
            className="mt-6 rounded-md bg-red-500 px-6 py-3 font-bold text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          >
            Abmelden
          </button>
        </div>
      ) : (
        <div className="text-center">
          <p className="mb-4 text-lg">Sie sind nicht angemeldet.</p>
          <Link
            href="/login" // Link zur Login-Seite
            className="rounded-md bg-blue-500 px-6 py-3 font-bold text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Anmelden
          </Link>
          <Link
            href="/signup" // Link zur Registrierungsseite
            className="ml-4 rounded-md bg-purple-500 px-6 py-3 font-bold text-white hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
          >
            Registrieren
          </Link>
        </div>
      )}
    </div>
  );
}