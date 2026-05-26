import { z } from "zod";
import { requirePermission } from "@/server/rbac/guard";
import { handleApiError, ok } from "@/lib/utils/api";
import { NotFoundError } from "@/lib/utils/errors";
import { addNote } from "@/lib/demo/store";

const noteSchema = z.object({ body: z.string().trim().min(1).max(4000) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermission("reviews:read");
    const { id } = await params;
    const body = noteSchema.parse(await req.json());
    const note = addNote(id, body.body);
    if (!note) throw new NotFoundError();
    return ok(note);
  } catch (err) {
    return handleApiError(err);
  }
}
