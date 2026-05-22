import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/server/rbac/guard";
import { handleApiError, ok } from "@/lib/utils/api";
import { NotFoundError } from "@/lib/utils/errors";

const noteSchema = z.object({ body: z.string().trim().min(1).max(4000) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requirePermission("reviews:read");
    const { id } = await params;
    const review = await prisma.review.findFirst({
      where: { id, organizationId: ctx.organizationId },
      select: { id: true, dealershipId: true },
    });
    if (!review) throw new NotFoundError();
    if (ctx.dealershipId && review.dealershipId !== ctx.dealershipId) throw new NotFoundError();

    const body = noteSchema.parse(await req.json());
    const note = await prisma.reviewNote.create({
      data: { reviewId: review.id, authorId: ctx.userId, body: body.body },
    });
    return ok(note);
  } catch (err) {
    return handleApiError(err);
  }
}
