import { type Team } from "../data/teams";

// ─── Shared types ──────────────────────────────────────────────────────────

export interface GroupResult {
  team: Team;
  points: number;
  gd: number;
  goalsFor: number;
  position: number;
}

export interface ThirdPlaceCandidate {
  team: Team;
  points: number;
  gd: number;
  goalsFor: number;
}

// ─── Utilities ─────────────────────────────────────────────────────────────

/** FIFA-style ordering: points → goal difference → goals scored → Elo (sim proxy for fair play). */
export function compareGroupStanding(a: ThirdPlaceCandidate, b: ThirdPlaceCandidate): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.gd !== a.gd) return b.gd - a.gd;
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  return b.team.eloRating - a.team.eloRating;
}

export function get8BestThirds(thirds: ThirdPlaceCandidate[]): Team[] {
  return [...thirds].sort(compareGroupStanding).slice(0, 8).map((r) => r.team);
}

// ─── Official 2026 World Cup R32 Bracket ──────────────────────────────────
//
// Source: FIFA 2026 World Cup official regulations, Annex C draw matrix.
// Each pair of adjacent bracket slots is one R32 match.

export const WINNER_SLOTS: Array<{ slot: number; group: string; pos: "W" | "R" }> = [
  { slot: 0, group: "E", pos: "W" },
  { slot: 2, group: "I", pos: "W" },
  { slot: 4, group: "A", pos: "R" },
  { slot: 5, group: "B", pos: "R" },
  { slot: 6, group: "F", pos: "W" },
  { slot: 7, group: "C", pos: "R" },
  { slot: 8, group: "K", pos: "R" },
  { slot: 9, group: "L", pos: "R" },
  { slot: 10, group: "H", pos: "W" },
  { slot: 11, group: "J", pos: "R" },
  { slot: 12, group: "D", pos: "W" },
  { slot: 14, group: "G", pos: "W" },
  { slot: 16, group: "C", pos: "W" },
  { slot: 17, group: "F", pos: "R" },
  { slot: 18, group: "E", pos: "R" },
  { slot: 19, group: "I", pos: "R" },
  { slot: 20, group: "A", pos: "W" },
  { slot: 22, group: "L", pos: "W" },
  { slot: 24, group: "J", pos: "W" },
  { slot: 25, group: "H", pos: "R" },
  { slot: 26, group: "D", pos: "R" },
  { slot: 27, group: "G", pos: "R" },
  { slot: 28, group: "B", pos: "W" },
  { slot: 30, group: "K", pos: "W" },
];

/** Floating 3rd-place slots — pool must not include the group winner they face. */
export const THIRD_SLOT_POOLS: Record<number, string[]> = {
  1: ["A", "B", "C", "D", "F"],
  3: ["C", "D", "F", "G", "H"],
  13: ["B", "E", "F", "I", "J"],
  15: ["A", "E", "H", "I", "J"],
  21: ["C", "E", "F", "H", "I"],
  23: ["E", "H", "I", "J", "K"],
  29: ["E", "F", "G", "I", "J"],
  31: ["D", "E", "I", "J", "L"],
};

const THIRD_SLOT_KEYS = Object.keys(THIRD_SLOT_POOLS).map(Number);

/** Annex C–style assignment via MCV backtracking over pool constraints. */
export function assignThirdsToSlots(qualifiedThirds: Team[]): Map<number, Team> {
  const sorted = [...qualifiedThirds].sort((a, b) => {
    const countEligible = (t: Team) =>
      THIRD_SLOT_KEYS.filter((s) => THIRD_SLOT_POOLS[s].includes(t.group)).length;
    return countEligible(a) - countEligible(b);
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
    throw new Error(
      `Invalid third-place combination: cannot assign ${sorted.map((t) => t.group).join(",")} to R32 slots`,
    );
  }

  return assignment;
}

/** Adjacent pairs (0–1, 2–3, …) are R32 fixtures — Category A/B/C per FIFA 2026 draw. */
export const R32_FIXTURE_SPEC: Array<{ label: string; slots: [number, number] }> = [
  { label: "1E vs 3rd", slots: [0, 1] },
  { label: "1I vs 3rd", slots: [2, 3] },
  { label: "2A vs 2B", slots: [4, 5] },
  { label: "1F vs 2C", slots: [6, 7] },
  { label: "2K vs 2L", slots: [8, 9] },
  { label: "1H vs 2J", slots: [10, 11] },
  { label: "1D vs 3rd", slots: [12, 13] },
  { label: "1G vs 3rd", slots: [14, 15] },
  { label: "1C vs 2F", slots: [16, 17] },
  { label: "2E vs 2I", slots: [18, 19] },
  { label: "1A vs 3rd", slots: [20, 21] },
  { label: "1L vs 3rd", slots: [22, 23] },
  { label: "1J vs 2H", slots: [24, 25] },
  { label: "2D vs 2G", slots: [26, 27] },
  { label: "1B vs 3rd", slots: [28, 29] },
  { label: "1K vs 3rd", slots: [30, 31] },
];

export function buildBracket(
  groupResults: Record<string, GroupResult[]>,
  allThirds: ThirdPlaceCandidate[],
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
  const thirdAssignment = assignThirdsToSlots(qualifiedThirds);

  const bracket: Team[] = new Array(32);

  for (const { slot, group, pos } of WINNER_SLOTS) {
    bracket[slot] = pos === "W" ? W[group] : R[group];
  }
  for (const [slot, team] of thirdAssignment) {
    bracket[slot] = team;
  }

  for (let i = 0; i < 32; i++) {
    if (!bracket[i]) {
      throw new Error(`Incomplete R32 bracket: missing team at slot ${i}`);
    }
  }

  for (const { slots } of R32_FIXTURE_SPEC) {
    const [a, b] = slots;
    if (bracket[a].group === bracket[b].group) {
      throw new Error(
        `Same-group R32 clash: ${bracket[a].name} vs ${bracket[b].name} (Group ${bracket[a].group})`,
      );
    }
  }

  return bracket;
}
