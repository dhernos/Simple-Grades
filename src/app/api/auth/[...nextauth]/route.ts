// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { Adapter } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";
import type { Session, User, Account, Profile, SessionStrategy } from "next-auth";

const prisma = new PrismaClient();

console.log("API Route: Secret loaded?", !!process.env.NEXTAUTH_SECRET);

// --- Hilfsfunktion zum Erneuern des Access Tokens ---
async function refreshAccessToken(token: JWT) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: {
        id: true,
        refreshToken: true,
        refreshTokenExpires: true,
      },
    });

    // Wichtige Prüfungen: Refresh Token muss existieren, übereinstimmen und gültig sein
    if (!user || !user.refreshToken || user.refreshToken !== token.refreshToken || !user.refreshTokenExpires) {
      console.error("RefreshAccessTokenError: Refresh Token not found, mismatched, or expires missing for user:", token.id);
      return { ...token, error: "RefreshAccessTokenError" as const };
    }

    if (Date.now() > user.refreshTokenExpires.getTime()) {
      console.error("RefreshAccessTokenError: Refresh Token has expired for user:", token.id);
      return { ...token, error: "RefreshAccessTokenError" as const };
    }

    // Generiere neues Access Token und neues Refresh Token
    const newAccessToken = `access_token_for_${user.id}_${Date.now()}`;
    const newAccessTokenExpiresIn = 3600; // 1 Stunde in Sekunden
    const newAccessTokenExpires = Date.now() + newAccessTokenExpiresIn * 1000;

    // Refresh Token Rotation: Generiere ein neues Refresh Token
    const newRefreshToken = `refresh_token_for_${user.id}_${Date.now()}`;
    // Das Ablaufdatum des Refresh Tokens bleibt das, was ursprünglich gesetzt wurde (aus der DB)
    const newRefreshTokenExpires = user.refreshTokenExpires; // Behalte das ursprüngliche Ablaufdatum bei

    // Aktualisiere das Refresh Token in der Datenbank
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: newRefreshToken,
        refreshTokenExpires: newRefreshTokenExpires, // Aktualisiere nur den Token, nicht das Datum
      },
    });

    console.log("Access Token refreshed for user:", token.id);

    return {
      ...token,
      accessToken: newAccessToken,
      accessTokenExpires: newAccessTokenExpires,
      refreshToken: newRefreshToken, // Wichtig: Das neue Refresh Token im JWT speichern
      error: undefined, // Fehler zurücksetzen
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return { ...token, error: "RefreshAccessTokenError" as const };
  }
}

export const authOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "checkbox" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Bitte geben Sie E-Mail und Passwort an.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error("Ungültige Anmeldeinformationen.");
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isValidPassword) {
          throw new Error("Ungültige Anmeldeinformationen.");
        }

        // --- Anpassung der Lebensdauer des Refresh Tokens basierend auf 'rememberMe' ---
        const initialAccessToken = `access_token_for_${user.id}_${Date.now()}`;
        const accessTokenExpiresIn = 3600; // Access Token 1 Stunde gültig
        const initialAccessTokenExpires = Date.now() + accessTokenExpiresIn * 1000;

        let refreshTokenExpiresInSeconds: number;
        // `rememberMe` kommt als String "true" oder "false" an
        if (credentials.rememberMe === "true") {
          refreshTokenExpiresInSeconds = 7 * 24 * 60 * 60; // 1 Woche
          console.log("Remember Me checked: Refresh Token for 1 week.");
        } else {
          refreshTokenExpiresInSeconds = 7 * 60 * 60; // 7 Stunden
          console.log("Remember Me unchecked: Refresh Token for 7 hours.");
        }
        const initialRefreshToken = `refresh_token_for_${user.id}_${Date.now()}`;
        const initialRefreshTokenExpires = new Date(Date.now() + refreshTokenExpiresInSeconds * 1000);

        // Speichere das Refresh Token und sein Ablaufdatum in der Datenbank
        await prisma.user.update({
          where: { id: user.id },
          data: {
            refreshToken: initialRefreshToken,
            refreshTokenExpires: initialRefreshTokenExpires,
          },
        });

        // Rückgabe des erweiterten Benutzerobjekts
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          accessToken: initialAccessToken,
          accessTokenExpires: initialAccessTokenExpires,
          refreshToken: initialRefreshToken,
          // Wichtig: Das tatsächliche Ablaufdatum des Refresh Tokens für Debugging hinzufügen
          // Auch wenn es primär in der DB liegt, kann es im Token hilfreich sein.
          refreshTokenExpires: initialRefreshTokenExpires.getTime(), // Als Timestamp
        };
      }
    })
  ],
  session: {
    strategy: "jwt" as SessionStrategy,
    // MaxAge für das JWT im Cookie. Setze es so, dass es immer länger ist als das Access Token,
    // aber es wird durch das Refresh Token System in der Datenbank gesteuert.
    maxAge: 30 * 24 * 60 * 60, // 30 Tage ist ein guter Default für JWT Cookies
  },

  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // Beim initialen Login (user Objekt ist vorhanden)
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accessToken = (user as any).accessToken;
        token.accessTokenExpires = (user as any).accessTokenExpires;
        token.refreshToken = (user as any).refreshToken;
        // Speichere das RefreshTokenExpires im JWT für Debugging/Tracking
        token.refreshTokenExpires = (user as any).refreshTokenExpires;

        // Setze das JWT 'exp' basierend auf dem AccessTokenExpires für die Cookie-Dauer
        // NextAuth.js verwendet 'exp', um die Session-Gültigkeit zu bestimmen.
        // Wir wollen, dass es so lange gültig ist wie das Access Token,
        // da das Refresh Token die wirkliche "Langlebigkeit" steuert.
        token.exp = Math.floor((token.accessTokenExpires as number) / 1000);

        return token;
      }

      // Bei jedem nachfolgenden Request, wenn das Token validiert/erneuert wird
      // Prüfen, ob das Access Token abgelaufen ist (Zeit in Millisekunden)
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        // Access Token ist noch gültig
        // Stelle sicher, dass `token.exp` weiterhin dem `accessTokenExpires` entspricht.
        token.exp = Math.floor((token.accessTokenExpires as number) / 1000);
        return token;
      }

      // Access Token ist abgelaufen, versuche es mit dem Refresh Token zu erneuern
      console.log("Access Token expired, attempting to refresh...");
      const refreshedToken = await refreshAccessToken(token);

      // Stelle sicher, dass 'exp' nach dem Refresh korrekt gesetzt wird
      if (refreshedToken.accessTokenExpires) {
         refreshedToken.exp = Math.floor((refreshedToken.accessTokenExpires as number) / 1000);
      } else {
         // Falls Refresh fehlschlägt, setze exp auf einen vergangenen Wert oder kurzfristig,
         // damit die Session schnell abläuft.
         refreshedToken.exp = Math.floor(Date.now() / 1000) - 10; // Sofort abgelaufen
      }

      return refreshedToken;
    },

    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
        session.user.role = token.role;
      }
      // Access Token an die Session weitergeben, damit es im Client verfügbar ist
      session.accessToken = token.accessToken as string;
      session.accessTokenExpires = token.accessTokenExpires as number; // Wichtig für Anzeige
      session.refreshToken = token.refreshToken as string; // Wichtig für Debugging
      session.refreshTokenExpires = token.refreshTokenExpires as number; // Wichtig für Debugging
      session.error = token.error; // Fehler weitergeben

      // Setze das `session.expires` Feld auf das `accessTokenExpires` des Tokens
      // Dieses Feld wird vom Frontend `useSession().data.expires` verwendet.
      // Es sollte die Gültigkeit des aktuellen Access Tokens widerspiegeln,
      // da das Refresh Token im Hintergrund die Session aufrechterhält.
      if (token.accessTokenExpires) {
          session.expires = new Date(token.accessTokenExpires).toISOString();
      } else {
          // Fallback, falls AccessTokenExpires nicht verfügbar ist (z.B. bei Fehlern)
          session.expires = new Date(Date.now() + 60 * 1000).toISOString(); // Kurz gültig
      }

      return session;
    }
  },
  pages: {
    signIn: "/login"
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };