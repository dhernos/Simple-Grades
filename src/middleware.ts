import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { protectedRoutes } from "@/lib/auth.config"; // Import der Konfiguration

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // ... (deine vorhandene Token-Fehlerprüfung bleibt hier) ...
    if (token && token.error) {
      console.warn(`Middleware: Detected token error '${token.error}' for user ID: ${token.id}. Redirecting to login.`);
      return NextResponse.redirect(new URL(`/login?error=${token.error}`, req.url));
    }

    // --- Die ausgelagerte Logik hier anwenden ---
    // Finde eine Route in der Konfiguration, die mit dem aktuellen Pfad übereinstimmt
    const matchedRoute = protectedRoutes.find(route => pathname.startsWith(route.path));

    if (matchedRoute) {
      // Wenn ein Match gefunden wurde, prüfe die Rolle des Benutzers
      const userRole = token?.role;
      if (!userRole || !matchedRoute.roles.includes(userRole)) {
        console.warn(`Middleware: Access denied for user '${token?.id}' with role '${userRole}' trying to access ${pathname}. Required roles: ${matchedRoute.roles.join(", ")}`);
        return NextResponse.redirect(new URL("/access-denied", req.url));
      }
    }
    // --- Ende der ausgelagerten Logik ---

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

// Der `matcher` in der Middleware-Konfiguration kann beibehalten werden,
// da er nur die Pfade filtert, für die die Middleware ausgeführt wird.
// Alternativ könnte man ihn auch aus der Konfigurationsdatei generieren.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/editor/:path*",
  ],
};