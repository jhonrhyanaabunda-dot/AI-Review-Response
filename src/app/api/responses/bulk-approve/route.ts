import { z } from "zod";
import { requirePermission } from "@/server/rbac/guard";
import { handleApiError, ok } from "@/lib/utils/api";
import { bulkApprove } from "@/server/services/responses";

const schema = z.object({ reviewIds: z.array(z.string()).min(1).max(100) });

export async function POST(req: Request) {
  try {
    const ctx = await requirePermission("responses:approve");
    const body = schema.parse(await req.json());
    const result = await bulkApprove({
      organizationId: ctx.organizationId,
      reviewIds: body.reviewIds,
      actorId: ctx.userId,
    });
    return ok(result);
  } catch (err) {
    return handleApiError(err);
  }
}
