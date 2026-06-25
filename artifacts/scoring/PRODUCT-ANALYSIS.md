# VScor Scoring — Product Analysis

**App:** `/app/` · **Focus:** India turf football + weekend leagues  
**Last updated:** 2026-06-15

## Positioning

| Mode | Status | Tagline |
|------|--------|---------|
| Turf pickup | Production-ready | Score tonight's 7-a-side and split the bill |
| Tournament league | Partial | Admin UI exists; standings/fixture loop closing in Phase 2 |

## Personas

- **Organiser** — teams, scorer assignment, turf split
- **Scorer** — live events at pitch (incl. dual-scorer)
- **Player** — results, career stats, who owes what
- **Spectator** — watch without account (Phase 1 public URL)
- **Coordinator** — fixtures, table, team approval

## Functional requirement domains

See [`REQUIREMENTS-TRACE.md`](REQUIREMENTS-TRACE.md) for full matrix (T/P/M/S/L/R/AUTH/PAY/STAT/WEB/ROAD-* IDs).

## Golden path

```text
Sign up → Onboarding → Quick match → Squad → Live score → Full time
→ Split turf → Share link → Spectators watch live
```

## Gap summary (prioritised)

| Priority | Gap | Phase |
|----------|-----|-------|
| P0 | Public live match URL | 1 |
| P0 | Matches hub (single home) | 1 |
| P0 | Onboarding wizard | 1 |
| P1 | Tournament standings from matches | 2 |
| P1 | Fixture → score → table loop | 2 |
| P2 | Points table / compare | 3 |
| P2 | Phone OTP login | 3 |
| P2 | Cloud sync for fixtures/follows | 4 |
| P2 | Server-side ACL | 4 |

## Roadmap phases

- **Phase 0** — Docs, CI, stub cleanup
- **Phase 1** — Turf loop (public URL, hub, onboarding, toasts)
- **Phase 2** — Tournament loop (standings, fixture linkage)
- **Phase 3** — Stats depth, OTP, UPI reminders, push
- **Phase 4** — Platform hardening (sync, ACL, dead code)

Related: [`UX-WEB-FIRST-PLAN.md`](UX-WEB-FIRST-PLAN.md), [`DEPLOY.md`](DEPLOY.md).
