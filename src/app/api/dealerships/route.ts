import { requirePermission } from "@/server/rbac/guard";
import { handleApiError, ok } from "@/lib/utils/api";
import { dealershipUpsertSchema } from "@/lib/validation";
import { createDealership, listDealerships } from "@/server/services/dealerships";

export async function GET() {
  try {
    const ctx = await requirePermission("dealerships:read");
    const rows = await listDealerships(ctx.organizationId);
    return ok(rows);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requirePermission("dealerships:write");
    const data = dealershipUpsertSchema.parse(await req.json());
    const row = await createDealership({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      data,
    });
    return ok(row, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
