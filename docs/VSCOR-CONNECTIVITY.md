# VScor Supabase connectivity

Self-hosted Supabase project **vscor** on VPS `72.61.227.53`.

## Public API / Studio

| Item | Value |
|------|-------|
| URL | `https://vscor-supabase.auxspire.com` |
| DNS | GoDaddy A record: `vscor-supabase` → `72.61.227.53` |
| SSL | Let's Encrypt via NPM (`npm-16`, expires 2026-09-14) |
| Stack path (VPS) | `/root/supabase-projects/vscor` |

**Verified (2026-06):** DNS → `72.61.227.53`, HTTP → 301 HTTPS, HTTPS → 401 on `/rest/v1/` without key (Kong/Studio — expected). API reachable from local dev without tunnel.

## Postgres (VPS only)

| Endpoint | Address |
|----------|---------|
| Session pooler | `127.0.0.1:5832` (on VPS) |
| Transaction pooler | `127.0.0.1:6943` (on VPS) |
| DB container | `docker exec vscor-db psql -U postgres -d postgres` |

Pooler is **not** exposed on the public IP. Do not expect `127.0.0.1:5832` to work from your PC without a tunnel.

## Migrations on the VPS

Preferred (no host `psql`, no hardcoded password):

```bash
docker exec -i vscor-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  < supabase/migrations/20260615120000_football_worldcup26_tables.sql
```

Or from repo root on VPS:

```bash
bash scripts/apply-migration-vps.sh
```

Verify:

```bash
docker exec vscor-db psql -U postgres -d postgres -c "\dt public.football_*"
```

**Status:** `20260615120000_football_worldcup26_tables.sql` applied — tables `football_api_sync_state`, `football_teams`, `football_fixtures`, `football_standings`.

## Local dev from Windows

1. Start SSH tunnel (keep window open):

   ```
   D:\Work\VPS\scripts\db-tunnel-vscor.cmd
   ```

   Maps `localhost:5832` → VPS pooler.

2. In `vscore-landing/.env`:

   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5832/postgres?schema=public
   VITE_SUPABASE_URL=https://vscor-supabase.auxspire.com
   VITE_SUPABASE_ANON_KEY=...
   SUPABASE_URL=https://vscor-supabase.auxspire.com
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

3. Run migrations or verify (migration already applied on VPS):

   ```powershell
   pnpm run setup:worldcup-football -- --skip-migration
   ```

Frontend live-data panel and Vercel sync need **public HTTPS** on `vscor-supabase.auxspire.com` (DNS + NPM SSL), not the tunnel.

## Checklist

- [x] Football tables migration on VPS
- [x] GoDaddy A record `vscor-supabase` → `72.61.227.53`
- [x] NPM proxy + Let's Encrypt for `vscor-supabase.auxspire.com`
- [x] Confirm `https://vscor-supabase.auxspire.com/rest/v1/` responds (401 without key = OK)
- [x] Vercel cron: `job=all` every **15 minutes** (`*/15 * * * *`)

## Env mapping (this repo)

| Your / Next.js name | Vite / api-server |
|---------------------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `VITE_SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `VITE_SUPABASE_ANON_KEY` |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | same |

See also [`.env.example`](../.env.example) and [RESTORE-WORLDCUP-BACKUP.md](./RESTORE-WORLDCUP-BACKUP.md).
