# VScor Scoring App — Requirements Traceability

Living spec mapping legacy PRD requirements to implementation, sprint status, and QA coverage.

**Last updated:** 2026-06-15  
**App path:** `/app/` (`artifacts/scoring`)  
**Revival sprints:** 0 (deploy readiness) · 1 (truthful data + friendly defaults) · 2+ (turf payments, PWA, Android)

---

## Definition of done (revival)

A new user on `https://vscor.in/app/` can:

1. See a clear error screen if Supabase env vars are missing (not a white crash).
2. Sign up with email.
3. Create teams and players with **no preloaded demo data**.
4. Run a **friendly match** through live scoring with PRD validation.
5. See **only real recorded events** at full time.
6. Refresh and retain data (localStorage + cloud when configured).

---

## Requirements matrix

| ID | Requirement | Status | Implementation | Tests |
|----|-------------|--------|----------------|-------|
| T1 | Team fields: name, coach, players | Met | `AddTeam.tsx`, `teamManagement.ts` | — |
| T2 | Teams persist across flow | Met | `localStorage` + `cloudSync.ts` | — |
| T3 | New teams in match dropdowns | Met | `NewMatch.tsx` → `registeredTeams` | — |
| T4 | Unique team names | Met | `findTeamByName`, duplicate dialog | `matchValidation.test.ts` |
| T5 | Same team twice blocked | Met | `NewMatch.tsx` `sameTeamError` | `matchValidation.test.ts` |
| P1 | Player name mandatory, phone optional | Met | `AddPlayer.tsx` | — |
| P2 | Duplicate name → red warning + phone hint | Met | `AddPlayer.tsx` | `matchValidation.test.ts` |
| P3 | Add Player below last card | Met | `AddTeam.tsx` | — |
| M1 | New match: teams, players per team, format | Met | `NewMatch.tsx` | `prdFlow.combination.test.ts` |
| M2 | Players per team mandatory, no default | Met | `playersPerTeam` starts `''` | `matchValidation.test.ts` |
| M3 | Formats: Single Continuous / Two Halves | Met | `matchFormat` `single` / `halves` | — |
| M4 | Friendly match default (revival) | Met | `selectedTournament` default `'friendly'` | — |
| M5 | Scoring level default basic (revival) | Met | `scoringLevel` default `'basic'` | — |
| M6 | Advanced options collapsed (revival) | Met | `showAdvancedOptions` toggle | — |
| S1 | Squad from registered team rosters | Met | `SelectSquad.tsx` + `playerDatabase` | `prdFlow.combination.test.ts` |
| S2 | No mock roster lists | Met | Removed `teamRosters` mock | — |
| S3 | Exactly X players per team | Met | `isSquadComplete` helpers | `matchValidation.test.ts` |
| S4 | Team warnings + start disabled | Met | `SelectSquad.tsx` | `matchValidation.test.ts` |
| L1 | Goal: type → scorer → optional assist | Met | `LiveScoring.tsx` | — |
| L2 | Foul: optional yellow/red, one card | Met | `LiveScoring.tsx` | — |
| L3 | Substitution: XI out, bench in | Met | `LiveScoring.tsx` | — |
| L4 | Events stored with full structure | Met | Match `events[]` | `prdFlow.combination.test.ts` |
| R1 | Results show actual events only | Met (Sprint 1) | Removed mock fallbacks | `statsAggregation.test.ts` |
| R2 | No demo teams on first launch | Met (Sprint 1) | `DEFAULT_TEAMS` → `[]` | — |
| UX1 | Bottom nav padding | Met | `pb-24` on screens | — |
| UX2 | DialogDescription on dialogs | Partial | Audit ongoing | — |
| AUTH1 | Forgot password (email) | Met (Sprint 3) | `LoginScreen`, `auth.ts` | — |
| AUTH2 | PWA installable | Met (Sprint 3) | `manifest.webmanifest`, `sw.js` | — |
| PAY1 | Post-match split turf CTA | Met (Sprint 2) | `MatchEventsScreen`, `matchPaymentPrompt.ts` | `matchPaymentPrompt.test.ts` |
| PAY2 | Who owes what in profile menu | Met (Sprint 2) | Renamed `MatchPayments` | — |
| STAT1 | Leaderboard from real matches | Met (Sprint 2) | `App` + `statsAggregation` | `statsAggregation.test.ts` |
| WEB-A1 | Stats stubs hidden (Soon badge) | Met (Web Phase A) | `StatsPage.tsx` | — |
| WEB-A2 | Dead buttons removed / View all → Live tab | Met (Web Phase A) | `LiveMatchesScreen`, `ScoringTab` | — |
| WEB-A3 | Edit Profile → prefilled Add Player | Met (Web Phase A) | `App.tsx`, `AddPlayer.tsx` | — |
| WEB-A4 | Profile menu cleanup | Met (Web Phase A) | My Career; removed Achievements stubs | — |
| WEB-A5 | Post-login loading overlay | Met (Web Phase A) | `isBootstrapping` in `App.tsx` | — |
| WEB-B1 | Bottom nav hidden in match flows | Met (Web Phase B) | `IMMERSIVE_VIEWS` in `App.tsx` | — |
| WEB-B2 | Quick turf match mode | Met (Web Phase B) | `NewMatch.tsx` quick toggle | — |
| WEB-B3 | Empty squad guidance + CTA | Met (Web Phase B) | `SelectSquad.tsx` | — |
| WEB-B4 | Player owes banner after split | Met (Web Phase B) | `MatchEventsScreen`, `matchPaymentPrompt.ts` | `matchPaymentPrompt.test.ts` |
| WEB-B5 | First-run Scoring tab CTA | Met (Web Phase B) | `ScoringTab.tsx` | — |
| ROAD-1.1 | Public spectator match URL `/app/match/:id` | Met | `main.tsx`, `SpectatorMatchScreen.tsx`, `urlRouting.ts` | `publicMatch.test.ts` |
| ROAD-1.2 | Public match API + PII redaction | Met | Edge `GET /public/matches/:matchId` | — |
| ROAD-1.3 | Share live link from match events | Met | `ShareDialog.tsx`, `MatchEventsScreen.tsx` | — |
| ROAD-1.4 | Unified Matches hub (2-tab nav) | Met | `MatchesHub.tsx`, `App.tsx` | — |
| ROAD-1.5 | Onboarding wizard (team → players → match) | Met | `OnboardingWizard.tsx` | — |
| ROAD-1.6 | Toast instead of alert in scoring flows | Met | `LiveScoring`, `EnterMatchResult`, `CalculatePayment` | — |
| ROAD-2.1 | Tournament standings engine | Met | `tournamentStandings.ts` | `tournamentStandings.test.ts` |
| ROAD-2.2 | Fixture ↔ match sync + Score from fixture | Met | `fixtureMatchSync.ts`, `TournamentFixturesTab` | — |
| ROAD-2.3 | Group+knockout format hidden until generator | Met | `AddTournament.tsx` | — |
| ROAD-2.4 | Tournament stats from real matches | Met | `TournamentProfileScreenUpdated.tsx` | — |
| ROAD-3.1 | Points Table + Compare screens unlocked | Met | `PointsTableScreen`, `CompareScreen`, `StatsPage` | — |
| ROAD-3.2 | Phone OTP sign-in tab | Met | `LoginScreen.tsx`, `auth.ts` | — |
| ROAD-3.3 | UPI in payment reminders + treasurer UPI field | Met | `CalculatePayment.tsx` | — |
| ROAD-3.4 | Player “I've paid” + treasurer confirm | Met | `CalculatePayment.tsx` | — |
| ROAD-3.5 | Web push subscribe endpoint + client sync | Met | `pushNotifications.ts`, edge `/push/subscribe` | — |
| ROAD-4.1 | Cloud sync: fixtures, follows, notifications | Met | `extendedCloudSync.ts`, `loadCloudData` | — |
| ROAD-4.2 | Sync conflict policy documented | Met | `SYNC-POLICY.md` | — |
| ROAD-4.3 | Scoring CI (typecheck, test, build) | Met | `.github/workflows/scoring-ci.yml` | — |
| ROAD-4.4 | Product analysis artifact | Met | `PRODUCT-ANALYSIS.md` | — |

---

## Sprint backlog

### Sprint 0 — Deploy readiness ✅

- [x] Non-throwing `supabase-env` + `getMissingSupabaseEnvVars()`
- [x] `SupabaseConfigError` screen
- [x] Dynamic `App` import when env configured
- [x] Root deploy glue (Vercel `/app/`, `prepare-vercel-output.mjs`)
- [ ] Production: Vercel env vars + Supabase migrations + edge function (ops)

### Sprint 1 — Truthful app ✅

- [x] Remove `DEFAULT_TEAMS` / `DEFAULT_PLAYERS` seed data
- [x] Remove mock fallbacks: `MatchEventsScreen`, profiles, leaderboard, stats
- [x] Friendly match + basic scoring defaults
- [x] Advanced options collapsed in `NewMatch`
- [x] Delete dead `teamRosters` in `SelectSquad`

### Sprint 2 — Turf golden path ✅

- [x] Post-match “Split turf cost?” CTA (`MatchEventsScreen` + `matchPaymentPrompt.ts`)
- [x] Wire `Leaderboard` / `StatsPage` to `statsAggregation` from `App`
- [x] Rename “Match Payments” → “Who owes what”; My Stats → `statsPage`
- [ ] Manual QA script (below) on staging

### Sprint 3 — Auth & PWA ✅ (partial)

- [x] Forgot password → email reset link (`requestPasswordReset` + LoginScreen)
- [x] Set new password after reset link (`PASSWORD_RECOVERY` + `updatePassword`)
- [x] PWA manifest, icons, theme-color, minimal service worker
- [x] Google sign-in (already on login screen; enable provider in Supabase)
- [x] Phone OTP sign-in tab (`LoginScreen` Send OTP / Verify OTP)
- [ ] Enable Phone provider in Supabase Dashboard (ops)
- [ ] Manual QA on staging

### Sprint 4 — Web-first UX (Phase A + B) ✅

- [x] Trust: stats Soon badges, dead button fixes, Edit Profile flow, loading overlay
- [x] Turf loop: immersive nav, quick match, empty squad CTA, player owes banner
- [x] See `UX-WEB-FIRST-PLAN.md` for Phase C+ roadmap
- [ ] Manual QA on staging (checklist in `UX-WEB-FIRST-PLAN.md`)

### Sprint 5 — Android (deferred)

---

## QA process

### Automated tests

Run from repo root:

```bash
pnpm --filter @workspace/scoring run test
```

| Layer | File | What it covers |
|-------|------|----------------|
| Unit | `src/utils/matchValidation.test.ts` | Team duplicate, same-team block, squad counts, form gates, duplicate player names |
| Unit | `src/utils/matchPaymentPrompt.test.ts` | Post-match payment CTA visibility rules |
| Unit | `src/utils/statsAggregation.test.ts` | Leaderboard/stats from completed matches only (no mocks) |
| Combination | `src/utils/prdFlow.combination.test.ts` | End-to-end **logic** chain: teams → match setup → squads → events → stats |

Combination tests validate PRD **business rules** without a browser. UI flows remain in manual QA.

### Manual QA checklist (golden path)

1. **Env** — unset `VITE_SUPABASE_URL` locally → friendly error screen.
2. **Teams** — add “Sunday FC”; duplicate name shows dialog.
3. **Players** — add 8 players; duplicate name shows red warning.
4. **Match** — friendly default; 7 per side; single continuous; select squad enabled only when filled.
5. **Squad** — warnings when short; start disabled until 7+7.
6. **Live** — goal + assist, foul + yellow, substitution.
7. **Results** — timeline matches recorded events only (no placeholder clubs).
8. **Persistence** — refresh; data remains.

### CI recommendation

Add to PR checks:

```bash
pnpm --filter @workspace/scoring run typecheck
pnpm --filter @workspace/scoring run test
pnpm --filter @workspace/scoring run build
```

---

## Data structures (PRD reference)

```ts
Team { id, name, coachManager, players[] }
Match { id, team1, team2, playersPerTeam, matchFormat, squad1[], squad2[], events[] }
Event { minute, type, team, player, assist, card, playerOut, playerIn }
```

Field names in code may differ (`teamA`/`team1`, `scoredBy`); normalization lives in screen components and `statsAggregation.ts`.

---

## Mock removal inventory (Sprint 1)

| File | Change |
|------|--------|
| `App.tsx` | Empty default teams/players |
| `MatchEventsScreen.tsx` | No Man Utd fallback; empty state |
| `LiveMatchesScreen.tsx` | Real matches only; generic team click |
| `Leaderboard.tsx` | Props / empty state |
| `StatsTab.tsx` | Props / empty state |
| `TeamProfileScreen.tsx` | No Rashford squad/matches |
| `PlayerProfileScreen.tsx` | No Rashford fallback |
| `SelectSquad.tsx` | Removed `teamRosters` |

---

## Related docs

- `CONTEXT.md` — technical architecture
- `DEPLOY.md` — Supabase + Vercel setup
- `docs/QA-FUNCTIONAL-ANALYSIS-REPORT.md` — prior QA analysis
