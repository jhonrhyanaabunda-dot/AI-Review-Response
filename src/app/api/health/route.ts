import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { redis } from "@/lib/redis/client";

export async function GET() {
  const checks: Record<string, "ok" | string> = {};
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = "ok";
  } catch (e) {
    checks.db = e instanceof Error ? e.message : "error";
  }
  try {
    await redis.ping();
    checks.redis = "ok";
  } catch (e) {
    checks.redis = e instanceof Error ? e.message : "error";
  }
  const status = Object.values(checks).every((v) => v === "ok") ? 200 : 503;
  return NextResponse.json({ status: status === 200 ? "ok" : "degraded", checks }, { status });
}
