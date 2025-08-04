// src/middleware.ts

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { protectedRoutes } from "@/lib/auth.config";
import { PrismaClient } from "@prisma/client";

// Erstelle eine einzelne Prisma-Instanz.
const prisma = new PrismaClient();

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // 1. Frühe Rückgabe bei fehlendem oder fehlerhaftem Token
    //    (Diese Logik hattest du bereits, sie ist gut so)
    if (!token) {
        // withAuth leitet uns bereits zum Login weiter, aber falls doch ein Pfad durchrutscht...
        return NextResponse.redirect(new URL("/login", req.url));
    }
    if (token.error) {
      console.warn(`Middleware: Detected token error '${token.error}' for user ID: ${token.id}. Redirecting to login.`);
      return NextResponse.redirect(new URL(`/login?error=${token.error}`, req.url));
    }

    // 2. Überprüfung des Refresh Tokens gegen die Datenbank
    if (token.id && token.refreshToken) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { refreshToken: true },
        });

        // Wenn der Refresh Token in der DB nicht existiert oder nicht übereinstimmt,
        // ist der Token ungültig.
        if (!user || user.refreshToken !== token.refreshToken) {
          console.warn(`Middleware: Mismatched or missing refresh token for user ID: ${token.id}. Forcing logout.`);
          // Leite den Benutzer sofort zum Login weiter und invalidiere die Session
          return NextResponse.redirect(new URL("/api/auth/signout?callbackUrl=/login", req.url));
        }
      } catch (error) {
        console.error("Middleware: Database error during refresh token check.", error);
        // Bei einem DB-Fehler leiten wir zur sicheren Seite weiter.
        return NextResponse.redirect(new URL("/login", req.url));
      }
    } else {
        // Falls der Token keine ID oder keinen refreshToken hat, ist er ungültig.
        // Das sollte in der `jwt` Callback-Logik verhindert werden, ist aber eine
        // gute Absicherung.
        console.warn(`Middleware: Token is missing ID or refreshToken. Forcing logout.`);
        return NextResponse.redirect(new URL("/api/auth/signout?callbackUrl=/login", req.url));
    }

    // 3. Rollenprüfung und Zugriffsverweigerung (deine bestehende Logik)
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