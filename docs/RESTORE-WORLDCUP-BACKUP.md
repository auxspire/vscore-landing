# Restore World Cup app (pre–live-data integration)

Created before the worldcup26.ir + Supabase live data integration. Use if new changes break the predictor.

## Quick restore (git — recommended)

From repo root:

```bash
git fetch
git checkout backup/worldcup-pre-live-data -- artifacts/worldcup artifacts/api-server vercel.json lib/api-spec
pnpm install
pnpm run typecheck
pnpm run build
```

Or switch entirely to the backup branch:

```bash
git checkout backup/worldcup-pre-live-data
```

Tagged snapshot: `worldcup-pre-live-data`

## File snapshot restore

Copies live under `artifacts/worldcup/.backup/pre-live-integration/`:

| Snapshot | Restore to |
|----------|------------|
| `pages/home.tsx` | `artifacts/worldcup/src/pages/home.tsx` |
| `pages/matchup.tsx` | `artifacts/worldcup/src/pages/matchup.tsx` |
| `pages/bracket.tsx` | `artifacts/worldcup/src/pages/bracket.tsx` |
| `pages/rankings.tsx` | `artifacts/worldcup/src/pages/rankings.tsx` |
| `lib/seo.ts` | `artifacts/worldcup/src/lib/seo.ts` |
| `index.html` | `artifacts/worldcup/index.html` |
| `api-server/routes/probability.ts` | `artifacts/api-server/src/routes/probability.ts` |
| `api-server/routes/index.ts` | `artifacts/api-server/src/routes/index.ts` |
| `api-server/services/simulator.ts` | `artifacts/api-server/src/services/simulator.ts` |
| `vercel.json` | `vercel.json` |
| `openapi.yaml` | `lib/api-spec/openapi.yaml` |

PowerShell example:

```powershell
$bak = "artifacts/worldcup/.backup/pre-live-integration"
Copy-Item "$bak/pages/home.tsx" "artifacts/worldcup/src/pages/home.tsx" -Force
Copy-Item "$bak/pages/matchup.tsx" "artifacts/worldcup/src/pages/matchup.tsx" -Force
Copy-Item "$bak/pages/bracket.tsx" "artifacts/worldcup/src/pages/bracket.tsx" -Force
Copy-Item "$bak/pages/rankings.tsx" "artifacts/worldcup/src/pages/rankings.tsx" -Force
Copy-Item "$bak/lib/seo.ts" "artifacts/worldcup/src/lib/seo.ts" -Force
Copy-Item "$bak/index.html" "artifacts/worldcup/index.html" -Force
Copy-Item "$bak/api-server/routes/probability.ts" "artifacts/api-server/src/routes/probability.ts" -Force
Copy-Item "$bak/api-server/routes/index.ts" "artifacts/api-server/src/routes/index.ts" -Force
Copy-Item "$bak/api-server/services/simulator.ts" "artifacts/api-server/src/services/simulator.ts" -Force
Copy-Item "$bak/vercel.json" "vercel.json" -Force
Copy-Item "$bak/openapi.yaml" "lib/api-spec/openapi.yaml" -Force
```

Then regenerate API client if OpenAPI was restored:

```bash
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck && pnpm run build
```

## Remove live-data-only files (optional)

If partially integrated, delete additions:

- `artifacts/worldcup/src/components/WorldCupFixturesStandingsPanel.tsx`
- `artifacts/worldcup/src/components/SharePredictionButton.tsx`
- `artifacts/worldcup/src/components/LiveMetricsToggle.tsx`
- `artifacts/worldcup/src/components/FaqSection.tsx`
- `artifacts/worldcup/src/hooks/useFootballData.ts`
- `artifacts/worldcup/src/lib/supabase.ts`
- `artifacts/api-server/src/services/worldcup26-client.ts`
- `artifacts/api-server/src/services/football-sync.ts`
- `artifacts/api-server/src/services/liveMetrics.ts`
- `artifacts/api-server/src/routes/sync-football-data.ts`
- `lib/football-config/`
