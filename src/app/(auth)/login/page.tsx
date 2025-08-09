"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { ForgotPasswordDialog } from "@/components/forgot-password-dialog"; 

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Zustand für den Dialog
  const [isForgotPasswordDialogOpen, setIsForgotPasswordDialogOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      rememberMe,
    });

    if (result?.error) {
      setError("E-Mail oder Passwort ist falsch.");
      console.error("Login fehlgeschlagen:", result.error);
    } else if (result?.ok) {
      router.push(callbackUrl);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md mx-auto p-4 space-y-4 bg-white shadow-lg rounded-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Anmelden</CardTitle>
          <CardDescription className="text-gray-600">Melde dich bei deinem Konto an</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="mb-2 block text-sm font-bold text-gray-700">
                E-Mail:
              </label>
              <Input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                className="w-full"
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
                  autoComplete="current-password"
                  className="w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-1 right-1 h-7 w-7 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  <span className="sr-only">Toggle password visibility</span>
                </Button>
              </div>
            </div>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  className="mr-2 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <label htmlFor="rememberMe" className="text-sm text-gray-700 cursor-pointer">
                  Angemeldet bleiben
                </label>
              </div>
              {/* Ändere den Link-Handler */}
              <button
                type="button"
                onClick={() => setIsForgotPasswordDialogOpen(true)}
                className="text-sm font-medium text-blue-600 hover:text-blue-500 cursor-pointer"
              >
                Passwort vergessen?
              </button>
            </div>
            
            {error && <p className="mb-4 text-center text-red-500">{error}</p>}
            
            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={loading}
            >
              {loading ? "Anmelden..." : "Anmelden"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            Noch kein Konto?{" "}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Jetzt registrieren
            </Link>
          </p>
        </CardContent>
      </Card>
      
      {/* Füge die neue Dialog-Komponente hinzu */}
      <ForgotPasswordDialog
        isOpen={isForgotPasswordDialogOpen}
        onClose={() => setIsForgotPasswordDialogOpen(false)}
      />
    </div>
  );
}