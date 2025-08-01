// src/app/(auth)/register/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// Import the icons from the new file
import { EyeIcon, EyeOffIcon } from "@/components/ui/eye_icon";

// Diese Funktion bewertet die Stärke eines Passworts
const validatePassword = (password: string) => {
  let strength = 0;
  if (password.length > 7) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/\d/.test(password)) strength += 1;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
  return strength;
};

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Aktualisiert die Passwortstärke, wenn sich das Passwort ändert
  useEffect(() => {
    setPasswordStrength(validatePassword(password));
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!name || !email || !password) {
      setError("Bitte füllen Sie alle Felder aus.");
      setLoading(false);
      return;
    }

    if (passwordStrength < 5) {
      setError("Das Passwort ist zu schwach. Es muss Großbuchstaben, Kleinbuchstaben, Zahlen und Sonderzeichen enthalten und mindestens 8 Zeichen lang sein.");
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

      const data = await response.json();

      if (response.ok) {
        setSuccess("Registrierung erfolgreich! Du kannst dich jetzt anmelden. 🎉");
        setTimeout(() => {
          router.push("/login?signupSuccess=true");
        }, 2000);
      } else {
        setError(data.message || "Registrierung fehlgeschlagen. Bitte versuche es erneut.");
        console.error("Registrierung fehlgeschlagen:", data);
      }
    } catch (err) {
      console.error("Fehler bei der Registrierung:", err);
      setError("Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später erneut.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = name && email && passwordStrength === 5;

  const getStrengthColor = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return "bg-red-500";
      case 2:
      case 3:
        return "bg-yellow-500";
      case 4:
        return "bg-blue-500";
      case 5:
        return "bg-green-500";
      default:
        return "bg-gray-200";
    }
  };

  const getStrengthWidth = (strength: number) => {
    return `${(strength / 5) * 100}%`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md mx-auto p-4 space-y-4 bg-white shadow-lg rounded-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Registrieren</CardTitle>
          <CardDescription className="text-gray-600">Erstelle dein Konto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="mb-2 block text-sm font-bold text-gray-700">
                Name:
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="mb-2 block text-sm font-bold text-gray-700">
                E-Mail:
              </label>
              <Input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-1 right-1 h-7 w-7"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  <span className="sr-only">Toggle password visibility</span>
                </Button>
              </div>
              
              {/* Passwortstärke-Anzeige */}
              {password.length > 0 && (
                <div className="w-full mt-2">
                  <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                    <span>Passwortstärke</span>
                    <span>{passwordStrength === 5 ? "Stark" : "Schwach"}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${getStrengthColor(passwordStrength)}`}
                      style={{ width: getStrengthWidth(passwordStrength) }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {error && <p className="mb-4 text-center text-red-500">{error}</p>}
            {success && <p className="mb-4 text-center text-green-600">{success}</p>}
            
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !isFormValid}
            >
              {loading ? "Registrieren..." : "Registrieren"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            Du hast bereits ein Konto?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Jetzt anmelden
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}