// src/types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT as NextAuthJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      role?: string;
    } & DefaultSession["user"];
    rememberMe?: boolean;
    accessToken: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    refreshTokenExpires?: number; // ✨ Hinzugefügt: Ablaufdatum des Refresh Tokens in der Session
    error?: "RefreshAccessTokenError";
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the `user` object returned from the `authorize` callback in the `CredentialsProvider`.
   */
  interface User extends DefaultUser {
    id: string;
    role?: string;
    accessToken: string;
    accessTokenExpires: number;
    refreshToken: string;
    refreshTokenExpires: number; // ✨ Hinzugefügt: Ablaufdatum des Refresh Tokens im User-Objekt
  }
}

declare module "next-auth/jwt" {
  /**
   * Returned by the `jwt` callback and `getToken`, when using JWT sessions
   */
  interface JWT extends NextAuthJWT {
    id: string;
    role?: string;
    accessToken: string;
    accessTokenExpires: number;
    refreshToken: string;
    refreshTokenExpires: number; // ✨ Hinzugefügt: Ablaufdatum des Refresh Tokens im JWT
    error?: "RefreshAccessTokenError";
    exp?: number;
  }
}