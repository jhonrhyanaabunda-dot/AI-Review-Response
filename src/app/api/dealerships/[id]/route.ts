import { requirePermission } from "@/server/rbac/guard";
import { handleApiError, ok } from "@/lib/utils/api";
import { dealershipUpsertSchema } from "@/lib/validation";
import { getDealership, updateDealership } from "@/server/services/dealerships";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requirePermission("dealerships:read");
    const { id } = await params;
    const row = await getDealership(ctx.organizationId, id);
    return ok(row);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requirePermission("dealerships:write");
    const { id } = await params;
    const data = dealershipUpsertSchema.partial().parse(await req.json());
    const row = await updateDealership({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      id,
      data,
    });
    return ok(row);
  } catch (err) {
    return handleApiError(err);
  }
}
