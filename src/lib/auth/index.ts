import { NextResponse } from "next/server";
import {
  DEMO_ADMIN_ID,
  type DemoUser,
} from "@/lib/demo/data";
import { fixture } from "@/lib/demo/data";

/**
 * Demo-mode auth shim.
 *
 * Replaces NextAuth entirely so the build doesn't require AUTH_SECRET,
 * DATABASE_URL, or Prisma at runtime. Every request resolves to the demo
 * admin; the dashboard treats them as logged-in.
 */

type DemoSession = {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
  };
  memberships: Array<{
    organizationId: string;
    role: "AGENCY_ADMIN" | "GENERAL_MANAGER" | "MARKETING_DIRECTOR" | "RESPONSE_AGENT" | "SUPER_ADMIN";
    dealershipId: string | null;
  }>;
  activeOrgId: string | null;
};

function demoUser(): DemoUser {
  return fixture.users.find((u) => u.id === DEMO_ADMIN_ID) ?? fixture.users[0]!;
}

export async function auth(): Promise<DemoSession> {
  const user = demoUser();
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    },
    memberships: fixture.memberships.map((m) => ({
      organizationId: m.organizationId,
      role: m.role,
      dealershipId: m.dealershipId,
    })),
    activeOrgId: fixture.org.id,
  };
}

export const handlers = {
  GET: async () =>
    NextResponse.json(
      { ok: false, error: "Auth is disabled in demo mode." },
      { status: 404 },
    ),
  POST: async () =>
    NextResponse.json(
      { ok: false, error: "Auth is disabled in demo mode." },
      { status: 404 },
    ),
};

export async function signIn() {
  return null;
}

export async function signOut() {
  return null;
}
