# VScor — vscore-landing

Monorepo for [vscor.in](https://vscor.in):

| URL | Package |
|---|---|
| `/` | `artifacts/website` — marketing landing page |
| `/worldcup/` | `artifacts/worldcup` — WC26 match predictor |
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
  worldcup/      WC26 predictor React app
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

| Variable | Required | Notes |
|---|---|---|
| `PORT` | Dev only | Defaults: website `19161`, worldcup `24152`, API `8080` |
| `BASE_PATH` | Dev only | Defaults: `/` (website), `/worldcup` (app) |
| `DATABASE_URL` | Future | Not used by predictor API today (in-memory teams) |
