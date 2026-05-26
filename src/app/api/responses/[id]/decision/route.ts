import { NextResponse } from "next/server";
import { requirePermission } from "@/server/rbac/guard";
import { handleApiError } from "@/lib/utils/api";
import { responseDecisionSchema } from "@/lib/validation";
import { decide } from "@/server/services/responses";
import { findResponseById } from "@/lib/demo/store";
import { cookieSerialize } from "@/lib/demo/state-cookie";
import { NotFoundError } from "@/lib/utils/errors";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requirePermission("responses:approve");
    const { id } = await params;
    const body = responseDecisionSchema.parse(await req.json());

    const response = findResponseById(id);
    if (!response) throw new NotFoundError();

    const { state, result } = await decide({
      organizationId: ctx.organizationId,
      reviewId: response.reviewId,
      actorId: ctx.userId,
      decision: body.decision,
      comment: body.comment,
      finalBody: body.finalBody,
    });
    return new NextResponse(JSON.stringify({ ok: true, data: result }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "set-cookie": cookieSerialize(state),
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
