// src/app/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Zum Navigieren zur Login-Seite

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Für Ladezustand des Buttons

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Alte Fehlermeldungen löschen
    setSuccess(null); // Alte Erfolgsmeldungen löschen
    setLoading(true); // Ladezustand aktivieren

    // Überprüfung, ob Name, E-Mail und Passwort ausgefüllt sind
    if (!name || !email || !password) {
      setError("Bitte füllen Sie alle Felder aus.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json(); // API-Antwort verarbeiten

      if (response.ok) {
        setSuccess("Registrierung erfolgreich! Du kannst dich jetzt anmelden. 🎉");
        // Optional: Nach einer kurzen Verzögerung zur Login-Seite weiterleiten
        setTimeout(() => {
          router.push("/login?signupSuccess=true");
        }, 2000); // 2 Sekunden Verzögerung
      } else {
        // Fehler von der API anzeigen
        setError(data.message || "Registrierung fehlgeschlagen. Bitte versuche es erneut.");
        console.error("Registrierung fehlgeschlagen:", data);
      }
    } catch (err) {
      // Fehler bei der Netzwerkanfrage oder im Server
      console.error("Fehler bei der Registrierung:", err);
      setError("Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später erneut.");
    } finally {
      setLoading(false); // Ladezustand deaktivieren
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold">Registrieren</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="mb-2 block text-sm font-bold text-gray-700">
              Name:
            </label>
            <input
              type="text"
              id="name"
              className="w-full rounded-md border px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading} // Deaktivieren, wenn Ladevorgang aktiv ist
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="mb-2 block text-sm font-bold text-gray-700">
              E-Mail:
            </label>
            <input
              type="email"
              id="email"
              className="w-full rounded-md border px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="mb-2 block text-sm font-bold text-gray-700">
              Passwort:
            </label>
            <input
              type="password"
              id="password"
              className="w-full rounded-md border px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          {error && <p className="mb-4 text-center text-red-500">{error}</p>}
          {success && <p className="mb-4 text-center text-green-600">{success}</p>}
          <button
            type="submit"
            className="w-full rounded-md bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
            disabled={loading} // Button während des Ladevorgangs deaktivieren
          >
            {loading ? "Registrieren..." : "Registrieren"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Du hast bereits ein Konto?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Jetzt anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}