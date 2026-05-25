import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

/**
 * Returns a Prisma client where every query is automatically scoped to the
 * given organizationId. This is defense in depth on top of route-level
 * RBAC checks - every query that touches tenant-scoped tables is filtered.
 *
 * Tables without an organizationId column (User, Account, Session, etc.)
 * are passed through unchanged. RBAC at the route layer remains responsible
 * for guarding those.
 */
const TENANT_SCOPED_MODELS = new Set([
  "Dealership",
  "Review",
  "AiResponse",
  "Approval",
  "Escalation",
  "ApiToken",
  "SyncJob",
  "ActivityLog",
  "Membership",
  "Invitation",
]);

export function tenantClient(organizationId: string) {
  return prisma.$extends({
    name: "tenant-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !TENANT_SCOPED_MODELS.has(model)) {
            return query(args);
          }
          const writeOps = new Set([
            "create",
            "createMany",
            "createManyAndReturn",
            "upsert",
          ]);
          if (writeOps.has(operation)) {
            const a = args as { data?: Record<string, unknown> | Record<string, unknown>[] };
            if (Array.isArray(a.data)) {
              a.data = a.data.map((d) => ({ organizationId, ...d }));
            } else if (a.data && !("organizationId" in a.data)) {
              a.data = { organizationId, ...a.data };
            }
          } else {
            const a = args as { where?: Record<string, unknown> };
            a.where = { ...(a.where ?? {}), organizationId };
          }
          return query(args);
        },
      },
    },
  });
}

export type TenantClient = ReturnType<typeof tenantClient>;
export type TransactionClient = Prisma.TransactionClient;
