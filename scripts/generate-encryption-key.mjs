// Run with: node scripts/generate-encryption-key.mjs
// Outputs a 32-byte hex string for use as ENCRYPTION_KEY in .env.
import { randomBytes } from "node:crypto";
process.stdout.write(randomBytes(32).toString("hex") + "\n");
