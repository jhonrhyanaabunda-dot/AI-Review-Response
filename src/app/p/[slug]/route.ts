import { NextResponse } from "next/server";
import {
  cookieSerialize,
  decodeState,
  withProspect,
  DEMO_COOKIE,
} from "@/lib/demo/state-cookie";
import { loadProspect } from "@/lib/demo/prospects";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const prospect = loadProspect(slug);
  if (!prospect) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  const cookieHeader = req.headers.get("cookie") ?? "";
  const raw = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${DEMO_COOKIE}=`))
    ?.slice(DEMO_COOKIE.length + 1);
  const next = withProspect(decodeState(raw), slug);

  const response = NextResponse.redirect(new URL("/dashboard", req.url));
  response.headers.set("set-cookie", cookieSerialize(next));
  return response;
}
