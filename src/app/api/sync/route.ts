import { handleApiError, ok } from "@/lib/utils/api";

// Demo mode: sync is a no-op. In production this enqueues platform pulls
// onto BullMQ; with no Redis we just acknowledge the request so the UI's
// "Sync now" button stays wired.
export async function POST() {
  try {
    return ok({ queued: 0, mode: "demo" });
  } catch (err) {
    return handleApiError(err);
  }
}
