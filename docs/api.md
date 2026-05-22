# API reference

All API routes are scoped to the caller's active organization via NextAuth
session cookies. Responses follow the envelope:

```json
{ "ok": true, "data": ... }
{ "ok": false, "error": { "code": "...", "message": "..." } }
```

## Reviews

### `GET /api/reviews`

Query params: `dealershipId`, `platform`, `sentiment`, `status`, `rating`,
`q`, `cursor`, `limit` (default 25, max 100).

Returns `{ items, nextCursor }`. Cursor pagination on `(postedAt desc, id desc)`.

### `GET /api/reviews/:id`

Full review with dealership, location, notes, responses, escalations, last
50 activity log entries.

### `POST /api/reviews/:id/notes`

Body: `{ "body": "internal note" }`. Internal-only note attached to the
review. Permission: `reviews:read`.

## Responses

### `POST /api/responses/:id/decision`

Body: `{ "decision": "APPROVED"|"REJECTED", "comment"?: string, "finalBody"?: string }`.
Approving optionally edits the body and queues a publish job. Permission:
`responses:approve`.

### `POST /api/responses/:id/regenerate`

Re-runs the AI graph from scratch. The previous draft is marked
`supersededAt`. Permission: `responses:generate`.

### `POST /api/responses/bulk-approve`

Body: `{ "reviewIds": string[] }`. Approves the active pending draft for
each review. Permission: `responses:approve`.

## Dealerships

`GET /api/dealerships` · `POST /api/dealerships` ·
`GET /api/dealerships/:id` · `PATCH /api/dealerships/:id`

Body for create/update follows `dealershipUpsertSchema`.

## Sync

### `POST /api/sync`

Body: `{ "sourceId"?: string, "dealershipId"?: string, "kind": "poll"|"backfill" }`.
Enqueues a sync job per active source matching the filter. Permission:
`tokens:write`.

## Analytics

### `GET /api/analytics/summary?from=...&to=...`

Returns aggregate stats, daily rating trend, dealership breakdown, and
p50 response time. Date range defaults to last 30 days. Permission:
`analytics:read`.

## Webhooks

### `POST /api/webhooks/:platform`

`platform` is one of `google`, `yelp`, `dealerrater`, `carsdotcom`,
`facebook`. Requires `X-Signature: <sha256(sourceId + AUTH_SECRET)>`.
Body: `{ "sourceId": string }`. The handler enqueues a sync job and
returns 200 immediately.

## Health

### `GET /api/health`

Returns 200 with `{ status: "ok", checks: {...} }` or 503 if any
dependency is down.
