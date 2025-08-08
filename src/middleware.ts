// src/middleware.ts

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { protectedRoutes } from "@/lib/auth.config";

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // 1. Überprüfung des Tokens auf Fehler
    if (!token || token.error) {
      console.warn(`Middleware: Token error '${token?.error}' detected. Forcing logout.`);
      return NextResponse.redirect(new URL("/logout", req.url));
    }

    // 2. Rollenprüfung und Zugriffsverweigerung
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