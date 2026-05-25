# Architecture

## High-level

```
                 ┌──────────────────────────────────────────────┐
                 │              Next.js App (Vercel)            │
                 │  ─ App Router pages: /inbox /reviews /...    │
                 │  ─ Server actions + API routes               │
                 │  ─ NextAuth (JWT sessions)                   │
                 └──────────────────┬───────────────────────────┘
                                    │  HTTPS
              ┌─────────────────────┼──────────────────────────────┐
              │                     │                              │
   ┌──────────▼─────────┐ ┌─────────▼──────────┐  ┌────────────────▼────────────┐
   │   Postgres (RDS)   │ │   Redis (Elasti.)   │  │ OpenAI / Provider APIs      │
   │   Prisma client    │ │   BullMQ + ratelim. │  │ Google · Yelp · DR · Cars   │
   └────────────────────┘ └──────────▲──────────┘  └─────────────────────────────┘
                                     │
                          ┌──────────┴──────────┐
                          │  Worker fleet (k8s) │
                          │  ─ sync-reviews     │
                          │  ─ generate-resp.   │
                          │  ─ publish-resp.    │
                          │  ─ scheduler        │
                          └─────────────────────┘
```

## Multi-tenancy

The tenant root is `Organization` (an agency). Every tenant-scoped row carries
`organizationId`. Authorization is enforced at two layers:

1. **Route layer** - `requirePermission(p, { dealershipId? })` reads the
   session, finds the active membership in the active org, and rejects on
   missing permission or out-of-scope dealership.
2. **Data layer** - `tenantClient(orgId)` returns a Prisma extension that
   injects the `organizationId` into every `where` and `data` payload for
   tenant-scoped models. Even a buggy route handler can't read another
   tenant's rows when going through this client.

For workspaces that need stronger isolation, the same `organizationId`
column trivially maps to Postgres Row-Level Security policies; the schema
is RLS-ready.

## Agent graph

`src/agents/graph/index.ts` is a small directed graph executor. Each node is
an idempotent function that reads `AgentState`, mutates the database, and
sets `state.next`. The graph supports two terminal states: `done` and
`approval` - the latter pauses the pipeline until a human acts, at which
point the API enqueues a publish job that resumes execution.

```
ingest ─► sentiment ─► respond ─► qa ─► (auto-publish | approval)
                  │
                  └─► escalate ─► done
```

Each node persists its decisions before returning `next`, so an interrupted
worker can be retried without producing duplicate AiResponse rows
(the `supersededAt` field tracks regenerations explicitly).

## Provider adapters

Each provider implements a tiny interface in
[src/providers/base/types.ts](../src/providers/base/types.ts):

```ts
interface ReviewProvider {
  platform: ReviewPlatform;
  fetchSince(ctx, cursor?): Promise<FetchResult>;
  publishResponse?(ctx, input): Promise<PublishResult>;
}
```

The registry in `src/providers/base/registry.ts` is the single composition
point - adding a new platform (TripAdvisor, BBB, Reddit, …) is a new file
plus one map entry.

## Queues

| Queue | Producer | Consumer | Purpose |
|-------|----------|----------|---------|
| `scheduler` | self (repeatable job) | `processScheduler` | every N minutes, fan out poll jobs |
| `sync-reviews` | scheduler, webhooks, manual sync API | `processSyncReviews` | call provider, upsert reviews, enqueue generation |
| `generate-response` | sync, manual regenerate | `processGenerateResponse` | run agent graph |
| `publish-response` | approval API, agent auto-publish | `processPublishResponse` | call provider, mark published |

All jobs default to **5 attempts, exponential backoff (2s base)** and
**rotation of completed/failed jobs** (24h / 7d) - see `jobDefaults`.

## Secrets

OAuth tokens and platform API keys are stored in `ApiToken.cipherText`
encrypted with `aes-256-gcm`. The key is provided via `ENCRYPTION_KEY`
(32 bytes hex). Decryption only happens inside the worker process when
calling a provider, never on the client.

## Observability

- Pino structured logs with field redaction.
- Health endpoint at `/api/health` checks Postgres + Redis.
- `ActivityLog` table records every meaningful state transition for SOC2
  audit.
- BullMQ exposes events that can be piped into Prometheus / OpenTelemetry.

## Extensibility

The architecture is set up so the next product ("AI Inbox Manager" for
dealership lead emails) can reuse the same building blocks:

- The agent graph is generic over `AgentState` - only the nodes change.
- The provider pattern handles any inbound/outbound message channel.
- The RBAC catalog is permission-namespaced (`inbox:read`, `inbox:reply`)
  so new products only add permissions, not new role hierarchies.
