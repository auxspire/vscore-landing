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

Password reset emails redirect to the app base URL (`/app/`). Ensure that URL is listed above.

Re-enable **Google** provider if used by the login screen.

### Phone OTP (optional)

In Supabase Dashboard → Authentication → Providers → **Phone**:

1. Enable the Phone provider and configure an SMS gateway (Twilio, MessageBird, etc.).
2. Set test phone numbers in development if using Supabase local auth.
3. Users sign in via **OTP** tab on the login screen (Send OTP → Verify OTP).

**Testing (no SMS):** While the Phone provider is not configured, use fixed test OTP **`2255`** for any valid phone number (10+ digits). The app skips sending SMS and the edge function `POST /auth/test-phone-otp` issues a session. Disable before public launch:

| Env (Vercel scoring SPA) | Value |
|--------------------------|--------|
| `VITE_DISABLE_TEST_OTP` | `true` to turn off test OTP in the client |

| Env (edge function) | Value |
|---------------------|--------|
| `VSCOR_ENABLE_TEST_OTP` | `false` to reject test OTP on server |
| `VSCOR_TEST_OTP` | Optional override (default `2255`) |

Redeploy the edge function after changing server env vars.

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

## 6. Public match endpoint

Spectator links use `GET /public/matches/:matchId` on the edge function (anon key + rate limit). No extra deploy step beyond §2; verify:

```bash
curl -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
  "https://vscor-supabase.auxspire.com/functions/v1/make-server-845a157a/public/matches/1"
```

Share URLs are path-based: `https://vscor.in/app/match/{id}` (handled by `main.tsx` bootstrap).
