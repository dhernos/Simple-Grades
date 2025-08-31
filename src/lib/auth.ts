import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { Adapter } from "next-auth/adapters";
import { randomUUID } from "crypto";
import redis from "@/lib/redis";
import { SessionStrategy } from "next-auth";
import { type Session, type User } from 'next-auth';
import { type JWT } from 'next-auth/jwt';

const prisma = new PrismaClient();

async function checkSessionInRedis(sessionId: string) {
  const session = await redis.hgetall(`session:${sessionId}`);
  return session;
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

        const sessionId = randomUUID();
        const now = Date.now();
        const maxAgeInSeconds = credentials.rememberMe === "true" ? 7 * 24 * 60 * 60 : 7 * 60 * 60; // 7 Tage oder 7 Stunden
        const sessionExpiresAt = now + maxAgeInSeconds * 1000;

        await redis.hmset(`session:${sessionId}`, {
          userId: user.id,
          expires: sessionExpiresAt.toString(),
          loginTime: now.toString(),
          role: user.role,
        });
        await redis.expire(`session:${sessionId}`, maxAgeInSeconds);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          sessionId: sessionId,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as SessionStrategy,
    maxAge: 7 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ user, token }: { user: User; token: JWT }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.sessionId = (user as User).sessionId;
      }
      if (token.sessionId) {
        const sessionData = await checkSessionInRedis(token.sessionId as string);

        if (sessionData && sessionData.userId === token.id) {
          token.id = sessionData.userId;
          token.role = sessionData.role;
          token.exp = Math.floor(parseInt(sessionData.expires) / 1000);
          return token;
        } else {
          console.warn("JWT callback: Session not found or mismatched in Redis. Invalidating token.");
          return { ...token, error: "InvalidSessionError" as const };
        }
      }

      return { ...token, error: "InvalidSessionError" as const };
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.error) {
        return {
          ...session,
          user: {
            id: "", // oder eine Dummy-ID, falls zulässig
            name: null,
            email: null,
            image: null,
            role: null,
            sessionId: null,
          },
          expires: new Date(0).toISOString(),
          error: token.error as string,
        };
      }
      if (token?.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.sessionId = token.sessionId as string;
      }
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