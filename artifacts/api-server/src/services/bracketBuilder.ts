import { type Team } from "../data/teams";

// ─── Shared types ──────────────────────────────────────────────────────────

export interface GroupResult {
  team: Team;
  points: number;
  gd: number;
  position: number;
}

// ─── Utilities ─────────────────────────────────────────────────────────────

export function get8BestThirds(
  thirds: Array<{ team: Team; points: number; gd: number }>
): Team[] {
  return [...thirds]
    .sort((a, b) =>
      b.points !== a.points ? b.points - a.points :
      b.gd    !== a.gd      ? b.gd - a.gd :
      b.team.eloRating - a.team.eloRating
    )
    .slice(0, 8)
    .map(r => r.team);
}

// ─── Official 2026 World Cup R32 Bracket ──────────────────────────────────
//
// Source: FIFA 2026 World Cup official regulations, Annex C draw matrix.
// Each pair of adjacent bracket slots is one R32 match.
//
// Bracket is divided into 4 quadrants; within a quadrant the two halves
// produce R16 opponents who then meet in the quarterfinal:
//
//   Quadrant 1 (slots  0–7 ): 1E/3th · 1I/3th · 2A/2B · 1F/2C   → QF1 → SF1
//   Quadrant 2 (slots  8–15): 2K/2L  · 1H/2J  · 1D/3th · 1G/3th  → QF2 → SF1
//   Quadrant 3 (slots 16–23): 1C/2F  · 2E/2I  · 1A/3th · 1L/3th  → QF3 → SF2
//   Quadrant 4 (slots 24–31): 1J/2H  · 2D/2G  · 1B/3th · 1K/3th  → QF4 → SF2
//
// Consequences for popular matchups:
//   Argentina (1J, slot 24) vs Portugal (1K, slot 30) → same quadrant (Q4)
//     → R32 impossible · R16 impossible · **earliest meeting = QF**
//   France (1I, slot 2) vs Argentina (1J, slot 24)   → different halves (Q1 vs Q4)
//     → R32/R16/QF/SF impossible · **earliest meeting = Final**

// Fixed winner/runner-up slots
const WINNER_SLOTS: Array<{ slot: number; group: string; pos: "W" | "R" }> = [
  { slot: 0,  group: "E", pos: "W" },   // M1a
  { slot: 2,  group: "I", pos: "W" },   // M2a
  { slot: 4,  group: "A", pos: "R" },   // M3a
  { slot: 5,  group: "B", pos: "R" },   // M3b
  { slot: 6,  group: "F", pos: "W" },   // M4a
  { slot: 7,  group: "C", pos: "R" },   // M4b

  { slot: 8,  group: "K", pos: "R" },   // M5a
  { slot: 9,  group: "L", pos: "R" },   // M5b
  { slot: 10, group: "H", pos: "W" },   // M6a
  { slot: 11, group: "J", pos: "R" },   // M6b
  { slot: 12, group: "D", pos: "W" },   // M7a
  { slot: 14, group: "G", pos: "W" },   // M8a

  { slot: 16, group: "C", pos: "W" },   // M9a
  { slot: 17, group: "F", pos: "R" },   // M9b
  { slot: 18, group: "E", pos: "R" },   // M10a
  { slot: 19, group: "I", pos: "R" },   // M10b
  { slot: 20, group: "A", pos: "W" },   // M11a
  { slot: 22, group: "L", pos: "W" },   // M12a

  { slot: 24, group: "J", pos: "W" },   // M13a
  { slot: 25, group: "H", pos: "R" },   // M13b
  { slot: 26, group: "D", pos: "R" },   // M14a
  { slot: 27, group: "G", pos: "R" },   // M14b
  { slot: 28, group: "B", pos: "W" },   // M15a
  { slot: 30, group: "K", pos: "W" },   // M16a
];

// Floating 3rd-place slots with pool constraints (which groups may occupy each)
// No slot's pool contains the same group as the group winner it faces —
// so same-group R32 clashes are structurally impossible.
const THIRD_SLOT_POOLS: Record<number, string[]> = {
  1:  ["A","B","C","D","F"],     // faces 1E
  3:  ["C","D","F","G","H"],     // faces 1I
  13: ["B","E","F","I","J"],     // faces 1D
  15: ["A","E","H","I","J"],     // faces 1G
  21: ["C","E","F","H","I"],     // faces 1A
  23: ["E","H","I","J","K"],     // faces 1L
  29: ["E","F","G","I","J"],     // faces 1B
  31: ["D","E","I","J","L"],     // faces 1K
};
const THIRD_SLOT_KEYS = Object.keys(THIRD_SLOT_POOLS).map(Number);

// ─── Annex-C–compliant 3rd-place slot assignment ───────────────────────────
// Assigns each of the 8 qualified 3rd-place teams to a valid slot using
// backtracking with the most-constrained-variable (MCV) heuristic.
// Guaranteed to find a solution for any valid combination of 8 qualifying
// groups, matching the intent of FIFA's 495-scenario Annex C matrix.

function assignThirdsToSlots(qualifiedThirds: Team[]): Map<number, Team> {
  const sorted = [...qualifiedThirds].sort((a, b) => {
    const countEligible = (t: Team) =>
      THIRD_SLOT_KEYS.filter(s => THIRD_SLOT_POOLS[s].includes(t.group)).length;
    return countEligible(a) - countEligible(b); // most constrained first
  });

  const assignment = new Map<number, Team>();

  function backtrack(i: number): boolean {
    if (i === sorted.length) return true;
    const team = sorted[i];
    for (const slot of THIRD_SLOT_KEYS) {
      if (assignment.has(slot)) continue;
      if (THIRD_SLOT_POOLS[slot].includes(team.group)) {
        assignment.set(slot, team);
        if (backtrack(i + 1)) return true;
        assignment.delete(slot);
      }
    }
    return false;
  }

  if (!backtrack(0)) {
    // Fallback: shouldn't happen with valid WC groups, but fill greedily
    for (const team of sorted) {
      for (const slot of THIRD_SLOT_KEYS) {
        if (!assignment.has(slot) && THIRD_SLOT_POOLS[slot].includes(team.group)) {
          assignment.set(slot, team);
          break;
        }
      }
    }
  }

  return assignment;
}

// ─── Public bracket builder ────────────────────────────────────────────────

/**
 * Build the official 32-team R32 bracket from group results.
 * Returns a 32-element array where adjacent pairs (i, i+1) are R32 opponents.
 *
 * @param groupResults  Simulated group stage outcomes keyed by group letter
 * @param allThirds     All 12 third-place finishers (function picks best 8)
 */
export function buildBracket(
  groupResults: Record<string, GroupResult[]>,
  allThirds: Array<{ team: Team; points: number; gd: number }>
): Team[] {
  const W: Record<string, Team> = {};
  const R: Record<string, Team> = {};

  for (const g of "ABCDEFGHIJKL".split("")) {
    const r = groupResults[g];
    if (!r) continue;
    W[g] = r[0].team;
    R[g] = r[1].team;
  }

  const qualifiedThirds = get8BestThirds(allThirds);
  const thirdAssignment  = assignThirdsToSlots(qualifiedThirds);

  const bracket: Team[] = new Array(32);

  for (const { slot, group, pos } of WINNER_SLOTS) {
    bracket[slot] = pos === "W" ? W[group] : R[group];
  }
  for (const [slot, team] of thirdAssignment) {
    bracket[slot] = team;
  }

  return bracket;
}
