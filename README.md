# VScor — vscore-landing

Monorepo for [vscor.in](https://vscor.in):

| URL | Package |
|---|---|
| `/` | `artifacts/website` — marketing landing page |
| `/worldcup/` | `artifacts/worldcup` — Matchup Predictor app |
| `/api/*` | `artifacts/api-server` — predictor API (in-memory) |

Deploys to **Vercel** on push to `main`.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+ (`npm install -g pnpm`)

## Setup

```bash
pnpm install
```

## Development (Cursor / local)

Run each service in a separate terminal:

```bash
# Landing page (port 19161)
pnpm run dev

# World Cup predictor UI (port 24152) — set BASE_PATH=/worldcup/
cd artifacts/worldcup && pnpm run dev

# API server (port 8080) — build once, then start
pnpm --filter @workspace/api-server run build
pnpm run dev:api
```

Open the worldcup app at `http://localhost:24152/worldcup/` (API calls go to `/api` on the same host in production; locally you may need a proxy or run behind Vercel dev).

## Build

```bash
pnpm run build
```

Production bundle for Vercel:

```bash
pnpm run vercel-build
```

Output lands in `dist/`:

- `dist/index.html` — landing
- `dist/worldcup/` — predictor SPA
- `api/index.mjs` — serverless API handler (Vercel)

## Project layout

```
artifacts/
  website/       Landing page source (edit index.html + assets)
  worldcup/      Matchup Predictor React app
  api-server/    Express API for predictor data
  mockup-sandbox/ Design preview tool (optional)
lib/             Shared API client, Zod schemas, DB (future)
api/             Vercel serverless entry for Express
scripts/         Build helpers
vercel.json      Deploy config
```

## Editing the landing page

Edit `artifacts/website/index.html` and `artifacts/website/public/` assets.  
Do **not** confuse with `artifacts/worldcup/index.html` (Vite shell for the app).

## Deploy

Push to `main` on GitHub → Vercel builds and deploys automatically.

No Replit required. Develop in Cursor, commit, push.

## Environment variables

See [`.env.example`](.env.example), [`docs/VSCOR-CONNECTIVITY.md`](docs/VSCOR-CONNECTIVITY.md), and [`docs/RESTORE-WORLDCUP-BACKUP.md`](docs/RESTORE-WORLDCUP-BACKUP.md).

| Variable | Required | Notes |
|---|---|---|
| `PORT` | Dev only | Defaults: website `19161`, worldcup `24152`, API `8080` |
| `BASE_PATH` | Dev only | Defaults: `/` (website), `/worldcup` (app) |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Live data panel | Public; RLS read-only |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Sync route | Server only |
| `WORLD_CUP26_JWT_TOKEN` | Sync route | From worldcup26.ir register/login |
| `CRON_SECRET` | Sync cron | Protects `/api/sync-football-data` |
| `DATABASE_URL` | Migrations | VPS pooler only; not used by Vercel sync |
