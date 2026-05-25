// Build-time DB bootstrap.
//
// If DATABASE_URL is set, runs `prisma migrate deploy` and the seed.
// If it isn't, prints a clear warning and exits 0 so the Next.js build
// can still complete. The landing + pitch pages will render fine in
// that state; the dashboard will 500 until DATABASE_URL is configured
// and the build is re-run.
import { execSync } from "node:child_process";

const url = process.env.DATABASE_URL;

if (!url) {
  console.warn(
    "\n[bootstrap-db] DATABASE_URL not set — skipping `prisma migrate deploy` and seed.",
  );
  console.warn(
    "[bootstrap-db] The Next.js build will still complete and the marketing pages will render.",
  );
  console.warn(
    "[bootstrap-db] Add DATABASE_URL in your hosting env vars and redeploy to activate the dashboard.\n",
  );
  process.exit(0);
}

try {
  console.log("[bootstrap-db] Applying migrations...");
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
} catch (err) {
  console.error("[bootstrap-db] prisma migrate deploy failed:", err.message);
  process.exit(1);
}

try {
  console.log("[bootstrap-db] Running seed (idempotent)...");
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
} catch (err) {
  // Seed failures shouldn't kill the build — schema is already migrated.
  console.warn("[bootstrap-db] Seed failed (non-fatal):", err.message);
}
