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

    if (!user || !user.refreshToken || user.refreshToken !== token.refreshToken || !user.refreshTokenExpires) {
      console.error("RefreshAccessTokenError: Refresh Token not found, mismatched, or expires missing for user:", token.id);
      return { ...token, error: "RefreshAccessTokenError" as const };
    }

    if (Date.now() > user.refreshTokenExpires.getTime()) {
      console.error("RefreshAccessTokenError: Refresh Token has expired for user:", token.id, " - Deleting token from database.");
      
      // Lösche den abgelaufenen Refresh Token aus der Datenbank
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
      refreshToken: newRefreshToken,
      error: undefined,
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
        token.exp = Math.floor((token.accessTokenExpires as number) / 1000);
        return token;
      }

      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        token.exp = Math.floor((token.accessTokenExpires as number) / 1000);
        return token;
      }

      console.log("Access Token expired, attempting to refresh...");
      const refreshedToken = await refreshAccessToken(token);

      if (refreshedToken.accessTokenExpires) {
        refreshedToken.exp = Math.floor((refreshedToken.accessTokenExpires as number) / 1000);
      } else {
        // Füge 'exp' hier hinzu, für den Fall, dass der Refresh fehlschlägt
        refreshedToken.exp = Math.floor(Date.now() / 1000) - 10;
      }
      return refreshedToken;
    },

    async session({ session, token }) {
      // Wenn ein Fehler vorliegt, z. B. weil der Refresh Token ungültig war,
      // beenden wir die Session, indem wir die user-Informationen entfernen
      // und das Ablaufdatum in der Vergangenheit setzen.
      if (token.error === "RefreshAccessTokenError") {
        return {
          ...session,
          user: null,
          expires: new Date(0).toISOString(),
          error: "RefreshAccessTokenError",
        };
      }

      if (token?.id) {
        session.user.id = token.id as string;
        session.user.role = token.role;
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