// src/types/next-auth.d.ts

import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT as NextAuthJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      sessionId?: string;
    } & DefaultSession["user"];
    error?: "InvalidSessionError";
  }

  interface User extends DefaultUser {
    id: string;
    role?: string;
    sessionId: string; // NEU: Enthält die Redis-Session-ID
  }
}

declare module "next-auth/jwt" {
  interface JWT extends NextAuthJWT {
    id: string;
    role?: string;
    sessionId: string; // NEU: Enthält die Redis-Session-ID
    error?: "InvalidSessionError";
    exp?: number;
  }
}