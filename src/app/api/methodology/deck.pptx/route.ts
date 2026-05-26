/**
 * Server-rendered PowerPoint download of the 90-Second Response Method deck.
 *
 * Implemented as a Node route handler so pptxgenjs (which uses node:fs and
 * node:https) doesn't get pulled into the browser bundle. The user gets a
 * real .pptx in one HTTP request.
 */
import { NextResponse } from "next/server";
import PptxGenJS from "pptxgenjs";
import { buildPptx, type PptxLike } from "@/lib/demo/deck-builder";
import { config } from "@/lib/demo/config";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function GET() {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = `${config.methodology.name} - A3 Brands`;
  pptx.author = "A3 Brands";

  // Our builder type is intentionally loose to avoid a hard dep on the
  // pptxgenjs types in shared code; the runtime shape matches.
  buildPptx(pptx as unknown as PptxLike, config.methodology, config);

  // Returns a Node Buffer with the .pptx ZIP bytes.
  const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "content-type":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "content-disposition":
        'attachment; filename="A3-Brands-90-Second-Response-Method.pptx"',
      "cache-control": "public, max-age=300",
    },
  });
}
