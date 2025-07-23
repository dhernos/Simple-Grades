// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function middleware(req) { // Mach die Funktion async, falls du Promise-basierte Logik nutzen willst (hier nicht nötig, aber gute Praxis)
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // --- KRITISCHE ANPASSUNG HIER ---
    // Wenn ein Token existiert, ABER es einen Fehler anzeigt (z.B. nach fehlgeschlagenem Refresh)
    // Dann ist die Session im Backend ungültig, auch wenn der Client es noch nicht weiß.
    // Wir leiten den Benutzer sofort zur Login-Seite um.
    if (token && token.error) {
      console.warn(`Middleware: Detected token error '${token.error}' for user ID: ${token.id}. Redirecting to login.`);
      return NextResponse.redirect(new URL(`/login?error=${token.error}`, req.url));
    }
    // --- ENDE KRITISCHE ANPASSUNG ---

    // Rollenbasierte Autorisierung (wird nur ausgeführt, wenn kein Token-Fehler vorliegt)
    // Beispiel: Admin-Bereich schützen
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      console.warn(`Middleware: Access denied for non-ADMIN user '${token?.id}' trying to access ${pathname}.`);
      return NextResponse.redirect(new URL("/access-denied", req.url));
    }

    // Beispiel: Editor-Bereich schützen
    if (pathname.startsWith("/editor") && token?.role !== "ADMIN" && token?.role !== "EDITOR") {
      console.warn(`Middleware: Access denied for non-ADMIN/EDITOR user '${token?.id}' trying to access ${pathname}.`);
      return NextResponse.redirect(new URL("/access-denied", req.url));
    }

    // Wenn alles in Ordnung ist (kein Token-Fehler und ausreichende Rolle), Anfrage fortsetzen
    return NextResponse.next();
  },
  {
    callbacks: {
      // Dieser Callback entscheidet, ob `middleware(req)` überhaupt ausgeführt wird.
      // Wenn er `false` zurückgibt, leitet `withAuth` direkt zu `pages.signIn` um.
      // Da wir die detailliertere Fehlerprüfung jetzt IN der `middleware` Funktion machen,
      // kann dieser `authorized` Callback weiterhin einfach prüfen, ob ein Token vorhanden ist.
      // Wenn ein Token vorhanden ist, aber fehlerhaft, wird er oben in der Middleware abgefangen.
      authorized: ({ token }) => {
        return !!token; // true, wenn ein Token-Objekt existiert (auch wenn es einen Fehler enthält)
      },
    },
    pages: {
      signIn: "/login", // Hierhin werden Benutzer umgeleitet, wenn `authorized` false ist
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/editor/:path*",
     // Schützt auch die Startseite, die Session-Infos anzeigt
    // Füge hier alle Pfade hinzu, die von der Middleware überprüft werden sollen
  ],
};