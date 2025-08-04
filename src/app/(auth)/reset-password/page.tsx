"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Aktualisiert die Passwortstärke, wenn sich das Passwort ändert
  useEffect(() => {
    setPasswordStrength(validatePassword(password));
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    if (!token) {
      setError("Ungültiger oder fehlender Token.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwörter stimmen nicht überein.");
      setLoading(false);
      return;
    }

    if (passwordStrength < 5) {
      setError("Das Passwort ist zu schwach. Es muss Großbuchstaben, Kleinbuchstaben, Zahlen und Sonderzeichen enthalten und mindestens 8 Zeichen lang sein.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, password }),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage(data.message);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } else {
      setError(data.message);
    }

    setLoading(false);
  };

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

  const isFormValid = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword && passwordStrength === 5;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md p-4 bg-white shadow-lg rounded-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Passwort zurücksetzen</CardTitle>
          <CardDescription className="text-gray-600">
            Gib dein neues Passwort ein
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-bold text-gray-700">
                Neues Passwort:
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showNewPassword ? "text" : "password"}
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
                  className="absolute bottom-1 right-1 h-7 w-7 cursor-pointer"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  type="button"
                >
                  {showNewPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  <span className="sr-only">Passwort anzeigen/verbergen</span>
                </Button>
              </div>
              
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
            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-bold text-gray-700">
                Passwort bestätigen:
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-1 right-1 h-7 w-7 cursor-pointer"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  type="button"
                >
                  {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  <span className="sr-only">Passwort anzeigen/verbergen</span>
                </Button>
              </div>
            </div>
            {message && <p className="text-center text-green-600">{message}</p>}
            {error && <p className="text-center text-red-500">{error}</p>}
            <Button type="submit" className="w-full cursor-pointer" disabled={loading || !isFormValid}>
              {loading ? "Zurücksetzen..." : "Passwort zurücksetzen"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}