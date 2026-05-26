import { NextResponse } from "next/server";
import { requirePermission } from "@/server/rbac/guard";
import { handleApiError } from "@/lib/utils/api";
import { regenerate } from "@/server/services/responses";
import { findResponseById, getReviewBodyForAi } from "@/lib/demo/store";
import { generateReply } from "@/lib/demo/ai";
import { cookieSerialize } from "@/lib/demo/state-cookie";
import { NotFoundError } from "@/lib/utils/errors";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requirePermission("responses:generate");
    const { id } = await params;
    const response = findResponseById(id);
    if (!response) throw new NotFoundError();
    const reviewCtx = getReviewBodyForAi(response.reviewId);
    if (!reviewCtx) throw new NotFoundError();

    const { body, source } = await generateReply({
      reviewBody: reviewCtx.body,
      authorName: reviewCtx.authorName,
      rating: reviewCtx.rating,
      dealershipName: reviewCtx.dealershipName,
      signOff: reviewCtx.signOff,
    });

    const { state } = await regenerate({
      organizationId: ctx.organizationId,
      reviewId: response.reviewId,
      actorId: ctx.userId,
      newBody: body,
    });

    return new NextResponse(
      JSON.stringify({ ok: true, data: { queued: true, source, body } }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "set-cookie": cookieSerialize(state),
        },
      },
    );
  } catch (err) {
    return handleApiError(err);
  }
}
