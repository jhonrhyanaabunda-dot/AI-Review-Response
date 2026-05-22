import { Role } from "@prisma/client";

/**
 * Permission catalog. Keep granular — combine via roleGrants below.
 * Permissions are namespaced "<resource>:<action>".
 */
export const PERMISSIONS = [
  "org:read",
  "org:update",
  "org:billing",
  "members:read",
  "members:invite",
  "members:remove",
  "dealerships:read",
  "dealerships:write",
  "dealerships:delete",
  "locations:write",
  "reviews:read",
  "reviews:assign",
  "reviews:ignore",
  "responses:read",
  "responses:generate",
  "responses:edit",
  "responses:approve",
  "responses:publish",
  "escalations:read",
  "escalations:resolve",
  "analytics:read",
  "tokens:read",
  "tokens:write",
  "settings:write",
  "system:admin",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_GRANTS: Record<Role, ReadonlyArray<Permission>> = {
  SUPER_ADMIN: [...PERMISSIONS],
  AGENCY_ADMIN: [
    "org:read",
    "org:update",
    "org:billing",
    "members:read",
    "members:invite",
    "members:remove",
    "dealerships:read",
    "dealerships:write",
    "dealerships:delete",
    "locations:write",
    "reviews:read",
    "reviews:assign",
    "reviews:ignore",
    "responses:read",
    "responses:generate",
    "responses:edit",
    "responses:approve",
    "responses:publish",
    "escalations:read",
    "escalations:resolve",
    "analytics:read",
    "tokens:read",
    "tokens:write",
    "settings:write",
  ],
  GENERAL_MANAGER: [
    "org:read",
    "dealerships:read",
    "members:read",
    "reviews:read",
    "reviews:assign",
    "reviews:ignore",
    "responses:read",
    "responses:edit",
    "responses:approve",
    "responses:publish",
    "escalations:read",
    "escalations:resolve",
    "analytics:read",
    "settings:write",
  ],
  MARKETING_DIRECTOR: [
    "org:read",
    "dealerships:read",
    "reviews:read",
    "responses:read",
    "responses:generate",
    "responses:edit",
    "responses:approve",
    "analytics:read",
    "settings:write",
  ],
  RESPONSE_AGENT: [
    "org:read",
    "dealerships:read",
    "reviews:read",
    "reviews:assign",
    "responses:read",
    "responses:generate",
    "responses:edit",
    "escalations:read",
  ],
};

export function permissionsForRole(role: Role): ReadonlyArray<Permission> {
  return ROLE_GRANTS[role] ?? [];
}

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_GRANTS[role]?.includes(permission) ?? false;
}
