#!/usr/bin/env bash
# Deploy scoring edge function to self-hosted VScor Supabase on VPS.
# Run from dev machine (requires SSH host "vps"): bash scripts/deploy-scoring-edge-vps.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VPS="${VSCOR_VPS_HOST:-vps}"
REMOTE_DIR="/root/supabase-projects/vscor/volumes/functions/make-server-845a157a"
LOCAL_DIR="$ROOT/supabase/functions/make-server-845a157a"

echo "==> Uploading edge function to $VPS:$REMOTE_DIR"
ssh "$VPS" "mkdir -p '$REMOTE_DIR'"
scp "$LOCAL_DIR/index.ts" "$LOCAL_DIR/kv_store.ts" "${VPS}:${REMOTE_DIR}/"

echo "==> Restarting edge runtime"
ssh "$VPS" "docker restart vscor-edge-functions"

echo "==> Waiting for worker..."
sleep 4

echo "==> Health check"
curl -sf "https://vscor-supabase.auxspire.com/functions/v1/make-server-845a157a/health" \
  | head -c 200 || true
echo ""
echo "Done."
