# VScor Scoring — Web-First UX Plan

**Goal:** Make the web app the primary product for India turf football — fast, obvious, trustworthy at the pitch.

**Out of scope:** Native Android wrappers until the web golden path is bulletproof.

---

## Golden path

```text
Sign up → Add team + players → Quick friendly match → Squad → Live score
→ Full time → Split turf → Share owes → Players see Who owes what
```

---

## Phase A — Trust (shipped in this pass)

| Item | Change |
|------|--------|
| Stats stubs | Points Table / Compare hidden behind "Soon" — only Leaderboard is tappable |
| Dead buttons | Removed Filter Matches; View All switches to Live tab |
| Edit Profile | Routes to Add Player with name/email prefilled if no linked profile |
| Profile menu | Renamed My Stats → My Career; removed Achievements/Help/Privacy stubs |
| Post-login | Loading overlay while cloud data syncs |
| Debug noise | Removed SelectSquad render logs |

---

## Phase B — Turf loop (shipped in this pass)

| Item | Change |
|------|--------|
| Immersive flows | Bottom nav hidden during squad / live / payment / new match |
| Quick match | Default ON in New Match — friendly, 60 min, minimal fields |
| Empty squad | Guidance + Add players CTA when team roster is empty |
| Player payment | Banner on match events when split exists (non-owner) → Who owes what |
| First run | Scoring tab CTA when no teams exist |

---

## Phase C — IA (next)

- Matches hub (merge Live + Scoring home)
- Public read-only match URL for spectators
- Onboarding wizard after signup

---

## Phase D — Depth (later)

- Tournament mode behind explicit toggle
- Points table, player/team compare
- Spectator login-free viewing

---

## QA checklist (manual)

1. New user → Scoring tab shows setup CTA  
2. Quick match → squad → live — bottom nav hidden throughout  
3. Stats page — only Leaderboard opens; others show Soon  
4. Edit Profile without player record → Add Player prefilled  
5. After payment split saved → player sees owes banner on match  
6. Login → brief "Loading your matches…" not empty flash  
