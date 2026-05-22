# AI Review Response

A multi-tenant SaaS platform that automatically ingests reviews from Google, Yelp,
DealerRater, Cars.com, and Facebook for automotive dealerships, generates contextual
AI responses, routes them through an approval workflow, and publishes the approved
replies back to the source platform.

## Stack

- **Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui** — the dashboard
- **PostgreSQL + Prisma** — durable storage
- **Redis + BullMQ** — queues and rate limiting
- **NextAuth v5** — credentials + Google OAuth, JWT sessions
- **OpenAI API** — sentiment, generation, and QA passes
- **A directed-graph agent runtime** — ingestion → sentiment → respond → escalate → QA → publish
- **Docker Compose** — local stack (Postgres, Redis, app, worker)

## Quick start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
node scripts/generate-encryption-key.mjs   # paste the result into ENCRYPTION_KEY
# add OPENAI_API_KEY and any provider keys you have

# 3. Bring up Postgres + Redis
docker compose up -d postgres redis

# 4. Migrate + seed
npx prisma migrate dev --name init
npm run db:seed

# 5. Dev server (one terminal)
npm run dev

# 6. Worker (another terminal)
npm run worker:dev
```

Sign in with `admin@example.com` / `password123` (from the seed).

For the full Docker setup, see [docs/architecture.md](docs/architecture.md)
and [docs/deployment.md](docs/deployment.md).

## Key paths

| Area | Path |
| ---- | ---- |
| Prisma schema | [prisma/schema.prisma](prisma/schema.prisma) |
| AI agents | [src/agents/](src/agents/) |
| Review providers | [src/providers/](src/providers/) |
| Worker entrypoint | [src/workers/index.ts](src/workers/index.ts) |
| API routes | [src/app/api/](src/app/api/) |
| Dashboard UI | [src/app/(dashboard)/](src/app/(dashboard)/) |
| Auth + RBAC | [src/lib/auth/](src/lib/auth/), [src/server/rbac/](src/server/rbac/) |

## Security highlights

- Tenant isolation enforced both at the route guard (`requirePermission`)
  and via a Prisma extension that injects `organizationId` into every
  tenant-scoped query.
- Third-party credentials encrypted at rest with AES-256-GCM
  ([src/lib/crypto/index.ts](src/lib/crypto/index.ts)).
- Argon2id password hashing.
- Rate limiting via a Redis Lua sliding window ([src/lib/redis/rate-limit.ts](src/lib/redis/rate-limit.ts)).
- Strict CSP-ready response headers in [next.config.ts](next.config.ts).
- Pino logger with redaction of token/cookie/password fields.
- Activity log for SOC2 audit (`ActivityLog` table).

## Status

This is a production-shaped scaffold: the agent graph, queues, schema, RBAC, and UI
flows are real. Third-party provider credentials and outbound publish endpoints are
shaped against the public API contracts but need live credentials and per-tenant
OAuth setup before they can call production endpoints — see the per-provider TODOs
in [src/providers/](src/providers/).
