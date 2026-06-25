# Deploy scoring edge function to VScor VPS (requires SSH host "vps")
# Usage: .\scripts\deploy-scoring-edge-vps.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Local = Join-Path $Root "supabase\functions\make-server-845a157a"
$Remote = "/root/supabase-projects/vscor/volumes/functions/make-server-845a157a"
$Vps = if ($env:VSCOR_VPS_HOST) { $env:VSCOR_VPS_HOST } else { "vps" }

Write-Host "==> Upload edge function to $Vps"
ssh $Vps "mkdir -p $Remote"
scp "$Local\index.ts" "$Local\kv_store.ts" "${Vps}:${Remote}/"

Write-Host "==> Restart vscor-edge-functions"
ssh $Vps "docker restart vscor-edge-functions"
Start-Sleep -Seconds 4

Write-Host "==> Health check"
curl.exe -s "https://vscor-supabase.auxspire.com/functions/v1/make-server-845a157a/health"
Write-Host ""
