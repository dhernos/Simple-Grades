// src/auth.ts

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { Adapter } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";
import { randomUUID } from "crypto";
import redis from "@/lib/redis"; // Importiere den Redis-Client

const prisma = new PrismaClient();

// Funktion zum Überprüfen der Session in Redis
async function checkSessionInRedis(sessionId: string) {
  // Holt alle Felder des Hashs
  const session = await redis.hgetall(`session:${sessionId}`);
  return session;
}

// Funktion zum Löschen der Session aus Redis
async function invalidateSession(sessionId: string) {
  await redis.del(`session:${sessionId}`);
}

export const authOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "checkbox" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Bitte geben Sie E-Mail und Passwort an.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Ungültige Anmeldeinformationen.");
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isValidPassword) {
          throw new Error("Ungültige Anmeldeinformationen.");
        }
        
        // NEU: Session in Redis erstellen
        const sessionId = randomUUID();
        const now = Date.now();
        const maxAgeInSeconds = credentials.rememberMe === "true" ? 7 * 24 * 60 * 60 : 7 * 60 * 60; // 7 Tage oder 7 Stunden
        const sessionExpiresAt = now + maxAgeInSeconds * 1000;
        
        // Speichere die Session-Daten in Redis als Hash
        await redis.hmset(`session:${sessionId}`, {
          userId: user.id,
          expires: sessionExpiresAt.toString(),
          loginTime: now.toString(),
          role: user.role,
          // Optional: Client-IP, User-Agent etc. hier speichern
        });

        // Setze die Ablaufzeit (TTL) für den Redis-Schlüssel
        await redis.expire(`session:${sessionId}`, maxAgeInSeconds);

        // Gib ein reduziertes User-Objekt zurück, das nur die sessionId enthält
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          sessionId: sessionId, // Der wichtige Teil für das JWT
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as SessionStrategy,
    // maxAge wird durch die Redis TTL gesteuert, hier nur als Fallback
    maxAge: 7 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Beim ersten Login (user ist vorhanden)
      if (user) {
        token.id = user.id;
        token.role = user.role;
        // NEU: Speichere nur die sessionId im JWT
        token.sessionId = (user as any).sessionId;
      }

      // Bei jeder folgenden Anfrage, validiere die Session in Redis
      if (token.sessionId) {
        const sessionData = await checkSessionInRedis(token.sessionId as string);

        if (sessionData && sessionData.userId === token.id) {
          // Session ist gültig. Aktualisiere Token mit den Session-Daten
          token.id = sessionData.userId;
          token.role = sessionData.role;
          // Setze die Ablaufzeit des JWTs basierend auf der Redis-Session
          token.exp = Math.floor(parseInt(sessionData.expires) / 1000);
          return token;
        } else {
          // Session in Redis nicht gefunden oder UserId stimmt nicht überein
          console.warn("JWT callback: Session not found or mismatched in Redis. Invalidating token.");
          // Erzwinge Logout, indem ein Fehler in den Token geschrieben wird
          return { ...token, error: "InvalidSessionError" as const };
        }
      }

      // Sollte dieser Zustand erreicht werden, ist der Token ungültig
      return { ...token, error: "InvalidSessionError" as const };
    },

    async session({ session, token }) {
      if (token.error) {
        // Der JWT-Callback hat einen Fehler gesetzt, z.B. weil die Redis-Session ungültig ist.
        // Die Session wird hiermit beendet.
        return {
          ...session,
          user: null,
          expires: new Date(0).toISOString(),
          error: token.error as string,
        };
      }
      
      // Übertrage die Daten vom Token zur Session
      if (token?.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }

      // Setze das Ablaufdatum der Session basierend auf dem JWT
      if (token.exp) {
        session.expires = new Date(token.exp * 1000).toISOString();
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};