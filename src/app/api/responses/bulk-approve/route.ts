import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/server/rbac/guard";
import { handleApiError } from "@/lib/utils/api";
import { bulkApprove } from "@/server/services/responses";
import { cookieSerialize } from "@/lib/demo/state-cookie";

const schema = z.object({ reviewIds: z.array(z.string()).min(1).max(100) });

export async function POST(req: Request) {
  try {
    const ctx = await requirePermission("responses:approve");
    const body = schema.parse(await req.json());
    const { state, result } = await bulkApprove({
      organizationId: ctx.organizationId,
      reviewIds: body.reviewIds,
      actorId: ctx.userId,
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
