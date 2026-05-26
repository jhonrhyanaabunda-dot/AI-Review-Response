# A3 Brands AI Review Response - demo

This repo is a self-contained **sales demo** for A3 Brands AI Review
Response. It runs end-to-end on Vercel with **zero databases and zero
required env vars** - the dashboard reads from an in-memory fixture and
remembers each visitor's approvals via a cookie.

## Deploy to Vercel (30 seconds)

1. Import `jhonrhyanaabunda-dot/AI-Review-Response` at vercel.com/new
2. Framework auto-detects as Next.js
3. Click **Deploy** - no env vars required

Optional env vars (set in Project Settings → Environment Variables):

| Variable | What it does |
| -------- | ------------ |
| `ANTHROPIC_API_KEY` | Powers the **Regenerate** button with Claude Haiku (~$0.001 / regen). If unset, the demo falls back to canned variants. |
| `NEXT_PUBLIC_SITE_URL` | Override the canonical URL used for OG/social previews. Defaults to your Vercel production URL. |

## What's in the demo

| Page | URL |
| ---- | --- |
| Marketing landing | `/` |
| Pitch / ROI page | `/pitch` |
| Dashboard | `/dashboard` |
| GM inbox (approve/reject) | `/inbox` |
| All reviews | `/reviews` |
| Review detail (with live Regenerate) | `/reviews/[id]` |
| Analytics | `/analytics` |
| Dealerships, Team, Settings | `/dealerships`, `/team`, `/settings` |

## Per-prospect demos

Want to send a tailored demo to a specific dealership prospect? Drop a
JSON file in [`prospects/`](prospects/) and visit `/p/<slug>` once. The
visitor's cookie remembers the overlay so every dashboard page renders
with their org name and dealership names baked in.

```bash
# prospects/wilson-bmw.json already exists - see it at:
your-deploy.vercel.app/p/wilson-bmw

# To add a new prospect (e.g. "summit-ford"):
# 1. Create prospects/summit-ford.json (copy wilson-bmw.json as a template)
# 2. Add `"summit-ford": (await import("../../../prospects/summit-ford.json")).default`
#    to src/lib/demo/prospects.ts
# 3. git push → Vercel rebuilds → send your-deploy.vercel.app/p/summit-ford
```

## Editing the demo content

Most demo content lives in editable JSON / TSX at the repo root - you can
edit it via the GitHub web UI (pencil icon on github.com) without ever
opening a terminal. Vercel auto-deploys every push to `main` (~30s, no env
vars touched).

| What | File | Notes |
| ---- | ---- | ----- |
| Org name, dealerships, sample reviews | [`demo-data/fixture.json`](demo-data/fixture.json) | Bulk demo content. |
| Book-a-call URL, support email, demo banner copy | [`demo-data/fixture.json`](demo-data/fixture.json) → `config` | Soft settings. |
| Per-prospect overlays | [`prospects/*.json`](prospects/) + one line in [`src/lib/demo/prospects.ts`](src/lib/demo/prospects.ts) | Send `your-deploy.vercel.app/p/<slug>` to a prospect. |
| Marketing landing copy | [`src/app/page.tsx`](src/app/page.tsx) | |
| Pitch / ROI copy | [`src/app/pitch/page.tsx`](src/app/pitch/page.tsx) | |

## How the demo persists state

- **Approvals / rejections / regenerated drafts** are stored in a single
  base64-JSON cookie named `a3_demo_state`. Survives cold starts; capped
  at ~4 KB.
- **Reset Demo button** (topbar) clears the cookie via `/api/demo/reset`.
- **No database, no Redis** - safe to deploy to any Node host.

## Local dev

```bash
npm install
npm run dev
# http://localhost:3000
```
