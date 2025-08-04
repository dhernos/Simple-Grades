// src/middleware.ts

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { protectedRoutes } from "@/lib/auth.config";

// Entferne die Prisma-Instanz, da sie in der Middleware nicht verwendet werden kann.
// const prisma = new PrismaClient(); // DIESE ZEILE ENTFERNEN

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // 1. Überprüfung des Tokens auf Fehler
    // Wir prüfen jetzt nur noch das `error`-Feld, das im jwt-Callback gesetzt wird.
    if (!token || token.error) {
      console.warn(`Middleware: Token error '${token?.error}' detected. Forcing logout.`);
      // Leite den Benutzer sofort zum Login weiter und invalidiere die Session
      return NextResponse.redirect(new URL("/logout", req.url));
    }

    // 2. Rollenprüfung und Zugriffsverweigerung (deine bestehende Logik)
    const matchedRoute = protectedRoutes.find(route => pathname.startsWith(route.path));
    if (matchedRoute) {
      const userRole = token.role;
      if (!userRole || !matchedRoute.roles.includes(userRole)) {
        console.warn(`Middleware: Access denied for user '${token.id}' with role '${userRole}' trying to access ${pathname}. Required roles: ${matchedRoute.roles.join(", ")}`);
        return NextResponse.redirect(new URL("/access-denied", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/editor/:path*",
  ],
};