import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import argon2 from "argon2";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 }, // 14 days
  secret: process.env.AUTH_SECRET,
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        const valid = await argon2.verify(user.passwordHash, password);
        if (!valid) return null;
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: false,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        token.uid = user.id;
      }
      // Refresh membership claims on sign-in or explicit update.
      if ((user?.id || trigger === "update") && token.uid) {
        const memberships = await prisma.membership.findMany({
          where: { userId: token.uid as string },
          select: { organizationId: true, role: true, dealershipId: true },
        });
        token.memberships = memberships;
        token.activeOrgId =
          (token.activeOrgId as string | undefined) ?? memberships[0]?.organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      session.memberships =
        (token.memberships as import("next-auth").Session["memberships"]) ?? [];
      session.activeOrgId = (token.activeOrgId as string | undefined) ?? null;
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      logger.info({ userId: user.id, email: user.email }, "auth.signIn");
    },
  },
};

// NextAuth v5 (beta) consolidates JWT into the main module; the
// `next-auth/jwt` subpath isn't a separate augmentation target anymore.
// We extend Session here and rely on a Record-typed `token` in callbacks.
declare module "next-auth" {
  interface Session {
    user: { id: string; email?: string | null; name?: string | null; image?: string | null };
    memberships: Array<{ organizationId: string; role: import("@prisma/client").Role; dealershipId: string | null }>;
    activeOrgId: string | null;
  }
}
