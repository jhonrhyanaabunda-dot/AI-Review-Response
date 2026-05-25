# Deployment

## Vercel (frontend + API)

The Next.js app deploys to Vercel as-is. Set these env vars in the Vercel
project (Production + Preview):

| Var | Notes |
| --- | --- |
| `DATABASE_URL` | Pooled Postgres connection (e.g. Neon, Supabase, RDS) |
| `SHADOW_DATABASE_URL` | A second Postgres database for `prisma migrate dev` only |
| `REDIS_URL` | Use rediss:// for managed Redis (Upstash, Elasticache) |
| `AUTH_SECRET` | 32+ byte random string |
| `AUTH_TRUST_HOST` | `true` |
| `ENCRYPTION_KEY` | 32-byte hex; rotate by re-encrypting `ApiToken` rows |
| `OPENAI_API_KEY` | required |
| Provider keys | `GOOGLE_*`, `YELP_API_KEY`, `DEALERRATER_API_KEY`, etc. |

The build runs `prisma generate && next build`.

> Migrations are not run by Vercel. Run `npm run db:deploy` from CI or a
> one-shot job whenever a new migration ships.

## Workers

The Vercel deployment is stateless and cannot host BullMQ workers
(serverless functions can't hold blocking Redis connections). Run the
worker image on:

- **Fly.io** - `flyctl deploy --dockerfile docker/Dockerfile.worker`
- **Render** - Background Worker service pointing at `docker/Dockerfile.worker`
- **AWS ECS / GCP Cloud Run jobs / Kubernetes** - see deployment manifests in your infra repo

Run **2+ replicas** in production. The scheduler is idempotent (BullMQ
deduplicates the repeatable job by jobId), so multiple replicas are safe.

## Database migrations

```bash
# in CI, against the production DB
DATABASE_URL=$PROD_DB npm run db:deploy
```

## Health & probes

- `/api/health` returns 200/503 with per-dependency status.
- Workers log structured JSON; surface `job.failed` events to your alerting.

## Webhooks

Each provider has a webhook endpoint at `/api/webhooks/{platform}` that
expects an `x-signature` header equal to `sha256(sourceId + AUTH_SECRET)`.
Configure each provider to call:

```
POST https://YOUR_DOMAIN/api/webhooks/google
Body: { "sourceId": "<id from ReviewSource>" }
Header: X-Signature: <sha256 as above>
```

The handler enqueues a `webhook` sync job and returns immediately, well
within provider timeout windows.

## Token rotation

`ENCRYPTION_KEY` rotation requires a one-shot script that walks
`ApiToken`, decrypts with the old key, re-encrypts with the new. Plan for
this - write the rotation script when you ship the second customer.

## Backups

- Postgres: nightly snapshots + WAL archiving. The data is mostly customer
  reviews; tolerable RPO is 5 min, RTO is 30 min.
- Redis: not authoritative - only queue state. Safe to lose; jobs are
  recreated by the scheduler.
