import type { NextAuthConfig } from "next-auth";

/**
 * Edge-runtime-safe auth config. Contains NO providers that use native
 * modules (argon2, bcrypt, prisma) — those run only at the API/server-
 * component layer in the Node runtime via `src/lib/auth/config.ts`.
 *
 * The middleware uses this slim config to validate JWT cookies without
 * touching the database.
 */
export const edgeAuthConfig: NextAuthConfig = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  secret: process.env.AUTH_SECRET,
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  pages: { signIn: "/login", error: "/login" },
  providers: [],
  callbacks: {
    // Pass-through so JWT validation works in the Edge runtime.
    async jwt({ token }) {
      return token;
    },
    async session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      return session;
    },
  },
};
