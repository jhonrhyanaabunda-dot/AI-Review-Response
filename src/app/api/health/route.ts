import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { status: "ok", mode: "demo", checks: { db: "demo-fixture", redis: "skipped" } },
    { status: 200 },
  );
}
