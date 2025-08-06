// src/auth.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { Adapter } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";
import type { SessionStrategy } from "next-auth";

const prisma = new PrismaClient();
const isImmediateCheckEnabled = process.env.IMMEDIATE_SESSION_CHECK_MODE === 'true';

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

    if (!user || !user.refreshToken || user.refreshToken !== token.refreshToken || !user.refreshTokenExpires) {
      console.error("RefreshAccessTokenError: Refresh Token not found, mismatched, or expires missing for user:", token.id);
      return { ...token, error: "RefreshAccessTokenError" as const };
    }

    if (Date.now() > user.refreshTokenExpires.getTime()) {
      console.error("RefreshAccessTokenError: Refresh Token has expired for user:", token.id);
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          refreshToken: null,
          refreshTokenExpires: null,
        },
      });
      return { ...token, error: "RefreshAccessTokenError" as const };
    }

    const newAccessToken = `access_token_for_${user.id}_${Date.now()}`;
    const newAccessTokenExpiresIn = 3600;
    const newAccessTokenExpires = Date.now() + newAccessTokenExpiresIn * 1000;

    const newRefreshToken = `refresh_token_for_${user.id}_${Date.now()}`;
    const newRefreshTokenExpires = user.refreshTokenExpires;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: newRefreshToken,
        refreshTokenExpires: newRefreshTokenExpires,
      },
    });

    console.log("Access Token refreshed for user:", token.id);

    return {
      ...token,
      accessToken: newAccessToken,
      accessTokenExpires: newAccessTokenExpires,
      refreshToken: newRefreshToken, // Den neuen Refresh Token zum Token hinzufügen
      refreshTokenExpires: newRefreshTokenExpires.getTime(),
      error: undefined,
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return { ...token, error: "RefreshAccessTokenError" as const };
  }
}

async function checkRefreshTokenInDb(userId: string, tokenRefreshToken: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { refreshToken: true },
    });
    return user && user.refreshToken === tokenRefreshToken;
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

        const initialAccessToken = `access_token_for_${user.id}_${Date.now()}`;
        const accessTokenExpiresIn = 3600;
        const initialAccessTokenExpires = Date.now() + accessTokenExpiresIn * 1000;

        let refreshTokenExpiresInSeconds: number;
        if (credentials.rememberMe === "true") {
          refreshTokenExpiresInSeconds = 7 * 24 * 60 * 60;
          console.log("Remember Me checked: Refresh Token for 1 week.");
        } else {
          refreshTokenExpiresInSeconds = 7 * 60 * 60;
          console.log("Remember Me unchecked: Refresh Token for 7 hours.");
        }
        const initialRefreshToken = `refresh_token_for_${user.id}_${Date.now()}`;
        const initialRefreshTokenExpires = new Date(Date.now() + refreshTokenExpiresInSeconds * 1000);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            refreshToken: initialRefreshToken,
            refreshTokenExpires: initialRefreshTokenExpires,
          },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          accessToken: initialAccessToken,
          accessTokenExpires: initialAccessTokenExpires,
          refreshToken: initialRefreshToken,
          refreshTokenExpires: initialRefreshTokenExpires.getTime(),
        };
      }
    })
  ],
  session: {
    strategy: "jwt" as SessionStrategy,
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accessToken = (user as any).accessToken;
        token.accessTokenExpires = (user as any).accessTokenExpires;
        token.refreshToken = (user as any).refreshToken;
        token.refreshTokenExpires = (user as any).refreshTokenExpires;
        // Der primäre exp Wert des JWTs sollte mit der Access Token Ablaufzeit übereinstimmen
        token.exp = Math.floor((token.accessTokenExpires as number) / 1000);
        return token;
      }

      // Wenn der Access Token abgelaufen ist, versuche ihn zu aktualisieren
      // Die JWT-Bibliothek prüft den exp-Wert automatisch.
      // Wir müssen hier nur den Refresh-Prozess starten, wenn der Token abgelaufen ist.
      // Hier keine manuelle Prüfung des Ablaufdatums
      if (isImmediateCheckEnabled) {
        const isTokenValid = await checkRefreshTokenInDb(token.id as string, token.refreshToken as string);
        if (isTokenValid) {
        // Access Token ist noch gültig, gib den Token unverändert zurück
        return token;
        }
      }else {
        if (!token.accessTokenExpires || Date.now() < token.accessTokenExpires) {
            return token; // Access Token ist noch gültig, gib den Token unverändert zurück
        }
      }
    // Wenn wir hier ankommen, ist der Access Token abgelaufen
      console.log("Access Token expired, attempting to refresh...");
      const refreshedToken = await refreshAccessToken(token);

      if (refreshedToken.error) {
        // Wenn ein Fehler beim Refresh auftritt, wird das Token zurückgegeben und
        // die Session im `session`-Callback beendet.
        return refreshedToken;
      }

      // Aktualisiere den exp Wert des Tokens mit der neuen Access Token Ablaufzeit
      refreshedToken.exp = Math.floor((refreshedToken.accessTokenExpires as number) / 1000);
      return refreshedToken;
    },

    async session({ session, token }) {
      if (token.error) {
        return {
          ...session,
          user: null,
          expires: new Date(0).toISOString(),
          error: token.error as string,
        };
      }

      if (token?.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }

      session.accessToken = token.accessToken as string;
      session.accessTokenExpires = token.accessTokenExpires as number;
      session.refreshToken = token.refreshToken as string;
      session.refreshTokenExpires = token.refreshTokenExpires as number;
      session.error = token.error;

      if (token.accessTokenExpires) {
        session.expires = new Date(token.accessTokenExpires).toISOString();
      } else {
        session.expires = new Date(Date.now() + 60 * 1000).toISOString();
      }
      return session;
    }
  },
  pages: {
    signIn: "/login"
  },
  secret: process.env.NEXTAUTH_SECRET,
};