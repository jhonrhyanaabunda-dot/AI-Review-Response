import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";
import { logger } from "./logger";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(code: string, message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status },
  );
}

export function handleApiError(err: unknown) {
  if (err instanceof ZodError) {
    return fail("validation_error", "Validation failed", 422, err.flatten());
  }
  if (err instanceof AppError) {
    return fail(err.code, err.message, err.status, err.details);
  }
  logger.error({ err }, "Unhandled API error");
  return fail("internal_error", "Something went wrong", 500);
}
