import { requirePermission } from "@/server/rbac/guard";
import { handleApiError, ok } from "@/lib/utils/api";
import { getReviewDetail } from "@/server/services/reviews";
import { NotFoundError } from "@/lib/utils/errors";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requirePermission("reviews:read");
    const { id } = await params;
    const row = await getReviewDetail(ctx.organizationId, id);
    if (!row) throw new NotFoundError();
    if (ctx.dealershipId && row.dealershipId !== ctx.dealershipId) throw new NotFoundError();
    return ok(row);
  } catch (err) {
    return handleApiError(err);
  }
}
