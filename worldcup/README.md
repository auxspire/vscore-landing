# World Cup Match Predictor

Monte Carlo simulation engine for the FIFA World Cup 2026. Predicts the probability of any two teams meeting at each stage of the tournament.

## Structure

```
worldcup/
  client/    React + Vite frontend
  server/    Express API server (pure simulation, no database needed)
```

## Quick start

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Run API server (default port 3001)
cd server && npm run dev

# Run frontend dev server (default port 3000, proxies /api → :3001)
cd client && npm run dev
```

Or from the root with both together:

```bash
npm install        # installs concurrently
npm run dev        # starts both server and client
```

## Features

- **Match Predictor** — probability of any two teams meeting at each stage
- **Bracket Path** — stage-by-stage bracket explorer for any of the 48 teams
- **Power Rankings** — all 48 teams ranked by tournament win probability
- **Popular Matchups** — pre-computed classic rivalries

## Tech stack

- Frontend: React 18, Vite, TanStack Query, Tailwind CSS v4, shadcn/ui, wouter
- Backend: Express 5, TypeScript, Pino logging
- Simulation: Elo-based Monte Carlo (10,000 runs per prediction)
