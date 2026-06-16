#!/usr/bin/env bash
# Run ON the VPS (where Supabase vscor stack runs). Applies football World Cup migration via session pooler.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SQL="$ROOT/supabase/migrations/20260615120000_football_worldcup26_tables.sql"
ENV_FILE="${VSCOR_ENV:-/root/supabase-projects/vscor/.env}"

if [[ ! -f "$SQL" ]]; then
  echo "Migration file not found: $SQL" >&2
  exit 1
fi

apply_via_docker() {
  echo "Applying migration via docker exec vscor-db ..."
  docker exec -i vscor-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 < "$SQL"
}

if command -v psql >/dev/null 2>&1 && [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  DATABASE_URL="${DATABASE_URL:-postgresql://postgres:${POSTGRES_PASSWORD}@127.0.0.1:5832/postgres?schema=public}"
  echo "Applying migration via psql session pooler ..."
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$SQL"
elif docker ps --format '{{.Names}}' | grep -qx 'vscor-db'; then
  apply_via_docker
else
  echo "Neither psql nor vscor-db container found on this host." >&2
  exit 1
fi

echo "Done. Verify tables:"
docker exec vscor-db psql -U postgres -d postgres -c "\dt public.football_*" 2>/dev/null \
  || psql "$DATABASE_URL" -c "\dt public.football_*"
