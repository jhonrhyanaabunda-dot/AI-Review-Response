import { requirePermission } from "@/server/rbac/guard";
import { handleApiError, ok } from "@/lib/utils/api";
import { responseDecisionSchema } from "@/lib/validation";
import { decide } from "@/server/services/responses";

/**
 * One-click GM decision endpoint keyed by REVIEW id (not response id) so the
 * inbox row can post {decision: "APPROVED"} | {decision: "REJECTED"} without
 * needing to know the underlying response row id.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requirePermission("responses:approve");
    const { id } = await params;
    const body = responseDecisionSchema.parse(await req.json());
    const result = await decide({
      organizationId: ctx.organizationId,
      reviewId: id,
      actorId: ctx.userId,
      decision: body.decision,
      comment: body.comment,
      finalBody: body.finalBody,
    });
    return ok(result);
  } catch (err) {
    return handleApiError(err);
  }
}
