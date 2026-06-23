# Scoring app — Supabase deploy

Production project: `https://vscor-supabase.auxspire.com`

## 1. Run migrations

Apply SQL in `supabase/migrations/`:

- `20260615130000_scoring_kv_store.sql` — `kv_store_845a157a` (edge function only; no client RLS policies)
- `20260615130100_scoring_relational_tables.sql` — 11 relational tables + authenticated RLS

```bash
supabase db push
# or paste into Supabase Dashboard → SQL Editor
```

## 2. Deploy edge function

Function name: `make-server-845a157a` (source: `supabase/functions/make-server-845a157a/`)

Requires env on the function (set automatically when linked to project):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

```bash
supabase functions deploy make-server-845a157a --project-ref <your-ref>
```

Verify:

```bash
curl -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
  https://vscor-supabase.auxspire.com/functions/v1/make-server-845a157a/health
```

## 3. Auth redirect URLs

In Supabase Dashboard → Authentication → URL configuration:

| Setting | Value |
|---------|--------|
| Site URL | `https://vscor.in/app/` |
| Redirect URLs | `https://vscor.in/app/`, `http://localhost:24153/app/` |

Re-enable **Google** provider if used by the login screen.

Google Cloud OAuth client must allow callback:

`https://vscor-supabase.auxspire.com/auth/v1/callback`

## 4. Vercel env (scoring SPA)

Same as worldcup:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SCORING_FUNCTION_SLUG=make-server-845a157a` (optional; this is the default)

## 5. Local dev

```bash
# from repo root
pnpm run dev:scoring
# open http://localhost:24153/app/
```

Copy `.env.example` values into `artifacts/scoring/.env.local` for local Supabase access.
