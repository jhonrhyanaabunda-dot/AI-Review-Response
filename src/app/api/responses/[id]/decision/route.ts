import { requirePermission } from "@/server/rbac/guard";
import { handleApiError, ok } from "@/lib/utils/api";
import { responseDecisionSchema } from "@/lib/validation";
import { decide } from "@/server/services/responses";
import { fixture } from "@/lib/demo/data";
import { NotFoundError } from "@/lib/utils/errors";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requirePermission("responses:approve");
    const { id } = await params;
    const body = responseDecisionSchema.parse(await req.json());

    const response = fixture.responses.find((r) => r.id === id);
    if (!response) throw new NotFoundError();

    const result = await decide({
      organizationId: ctx.organizationId,
      reviewId: response.reviewId,
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
