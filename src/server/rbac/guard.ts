import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";
import { ForbiddenError, UnauthorizedError } from "@/lib/utils/errors";
import { roleHasPermission, type Permission } from "./policies";

export type AuthContext = {
  userId: string;
  organizationId: string;
  role: Role;
  dealershipId: string | null;
};

/**
 * Resolves the auth context from the current request session and asserts
 * the caller has the given permission against the active organization.
 *
 * If `dealershipId` is provided and the member's scope is pinned to a single
 * dealership, the scopes must match.
 */
export async function requirePermission(
  permission: Permission,
  opts: { dealershipId?: string } = {},
): Promise<AuthContext> {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();

  const orgId = session.activeOrgId;
  if (!orgId) throw new ForbiddenError("No active organization");

  const membership = session.memberships.find((m) => m.organizationId === orgId);
  if (!membership) throw new ForbiddenError("Not a member of this organization");

  if (!roleHasPermission(membership.role, permission)) {
    throw new ForbiddenError(`Missing permission: ${permission}`);
  }

  if (membership.dealershipId && opts.dealershipId && membership.dealershipId !== opts.dealershipId) {
    throw new ForbiddenError("Out of dealership scope");
  }

  return {
    userId: session.user.id,
    organizationId: orgId,
    role: membership.role,
    dealershipId: membership.dealershipId,
  };
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await auth();
  if (!session?.user?.id || !session.activeOrgId) return null;
  const membership = session.memberships.find(
    (m) => m.organizationId === session.activeOrgId,
  );
  if (!membership) return null;
  return {
    userId: session.user.id,
    organizationId: session.activeOrgId,
    role: membership.role,
    dealershipId: membership.dealershipId,
  };
}
