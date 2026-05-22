import { requirePermission } from "@/server/rbac/guard";
import { handleApiError, ok } from "@/lib/utils/api";
import { regenerate } from "@/server/services/responses";
import { prisma } from "@/lib/db/prisma";
import { NotFoundError } from "@/lib/utils/errors";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requirePermission("responses:generate");
    const { id } = await params;
    const response = await prisma.aiResponse.findFirst({
      where: { id, organizationId: ctx.organizationId },
      select: { reviewId: true },
    });
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
