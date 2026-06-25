# Cloud sync conflict policy

**Canonical path:** KV bulk sync via `cloudSync.ts` and edge `/sync`.

## Entity arrays (teams, players, matches, …)

- **Pull:** Cloud wins when cloud array is non-empty (`loadCloudData` in `App.tsx`).
- **Ownership merge:** Missing `coordinator_user_ids` / `created_by` restored from local copy when cloud lacks them.
- **Matches:** Newer `completedAt` / `updatedAt` preferred in `mergeMatches`.

## Dual-scorer events

- **Append-only** via `eventSync.ts` and `/match-events/:matchId` — avoids last-write-wins on `events[]`.

## Extended entities (Phase 4)

- `tournament_fixtures`, `user_follows`, `notifications` sync types added to KV.
- Migrate from localStorage on login via `extendedCloudSync.migrateExtendedLocalData()`.

## Server ACL

- Bulk PUT accepts authenticated client arrays (gateway + optional `X-User-Token`).
- Row-level ACL deferred until relational sync is primary.

## Relational sync (`syncEngine.ts`)

- Last-write-wins on `updated_at`; ties → cloud wins.
