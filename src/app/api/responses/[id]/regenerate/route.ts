import { requirePermission } from "@/server/rbac/guard";
import { handleApiError, ok } from "@/lib/utils/api";
import { regenerate } from "@/server/services/responses";
import { fixture } from "@/lib/demo/data";
import { NotFoundError } from "@/lib/utils/errors";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requirePermission("responses:generate");
    const { id } = await params;
    const response = fixture.responses.find((r) => r.id === id);
    if (!response) throw new NotFoundError();
    await regenerate({
      organizationId: ctx.organizationId,
      reviewId: response.reviewId,
      actorId: ctx.userId,
    });
    return ok({ queued: true });
  } catch (err) {
    return handleApiError(err);
  }
}
