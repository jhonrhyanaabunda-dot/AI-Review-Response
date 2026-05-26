import type { Role } from "@prisma/client";
import { DEMO_ADMIN_ID } from "@/lib/demo/data";
import { DEMO_ORG_ID } from "@/lib/demo/store";
import type { Permission } from "./policies";

export type AuthContext = {
  userId: string;
  organizationId: string;
  role: Role;
  dealershipId: string | null;
};

// Demo mode: every request runs as the agency admin in the demo org.
// All permission checks pass.
export async function requirePermission(
  _permission: Permission,
  _opts: { dealershipId?: string } = {},
): Promise<AuthContext> {
  return {
    userId: DEMO_ADMIN_ID,
    organizationId: DEMO_ORG_ID,
    role: "AGENCY_ADMIN",
    dealershipId: null,
  };
}

export async function getAuthContext(): Promise<AuthContext | null> {
  return {
    userId: DEMO_ADMIN_ID,
    organizationId: DEMO_ORG_ID,
    role: "AGENCY_ADMIN",
    dealershipId: null,
  };
}
