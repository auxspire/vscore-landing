import type { FootballStanding, FootballTeam } from "@/hooks/useFootballData";

/** Team resolved for a bracket slot (live data). */
export interface BracketTeamRecord {
  apiTeamId: string;
  name: string;
  fifaCode: string | null;
  group: string;
  flagUrl: string | null;
}

export interface GroupResult {
  team: BracketTeamRecord;
  points: number;
  gd: number;
  goalsFor: number;
  position: number;
}

export interface ThirdPlaceCandidate {
  team: BracketTeamRecord;
  points: number;
  gd: number;
  goalsFor: number;
}

export function compareGroupStanding(a: ThirdPlaceCandidate, b: ThirdPlaceCandidate): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.gd !== a.gd) return b.gd - a.gd;
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  return a.team.name.localeCompare(b.team.name);
}

export function get8BestThirds(thirds: ThirdPlaceCandidate[]): BracketTeamRecord[] {
  return [...thirds].sort(compareGroupStanding).slice(0, 8).map((r) => r.team);
}

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

export function assignThirdsToSlots(qualifiedThirds: BracketTeamRecord[]): Map<number, BracketTeamRecord> {
  const sorted = [...qualifiedThirds].sort((a, b) => {
    const countEligible = (t: BracketTeamRecord) =>
      THIRD_SLOT_KEYS.filter((s) => THIRD_SLOT_POOLS[s].includes(t.group)).length;
    return countEligible(a) - countEligible(b);
  });

  const assignment = new Map<number, BracketTeamRecord>();

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
    throw new Error("Cannot assign third-place teams to R32 slots");
  }

  return assignment;
}

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

export function slotPlaceholderLabel(slot: number): string {
  const ws = WINNER_SLOTS.find((s) => s.slot === slot);
  if (ws) return ws.pos === "W" ? `Winner Group ${ws.group}` : `Runner-up Group ${ws.group}`;
  const pool = THIRD_SLOT_POOLS[slot];
  if (pool) return `3rd (${pool.join("/")})`;
  return "TBD";
}

function teamFromStanding(
  standing: FootballStanding,
  teamById: Map<string, FootballTeam>,
): BracketTeamRecord {
  const meta = teamById.get(standing.team_id);
  return {
    apiTeamId: standing.team_id,
    name: standing.team_name ?? meta?.name_en ?? "TBD",
    fifaCode: meta?.fifa_code ?? null,
    group: String(standing.group_name ?? meta?.group_name ?? "").toUpperCase(),
    flagUrl: meta?.flag_url ?? null,
  };
}

export function buildGroupResultsFromStandings(
  standings: FootballStanding[],
  teams: FootballTeam[],
): {
  groupResults: Record<string, GroupResult[]>;
  allThirdCandidates: ThirdPlaceCandidate[];
  qualifiedThirdGroups: Set<string>;
} {
  const teamById = new Map(teams.map((t) => [t.api_team_id, t]));
  const byGroup = new Map<string, FootballStanding[]>();

  for (const row of standings) {
    if (!row.group_name || row.rank == null) continue;
    const g = String(row.group_name).toUpperCase();
    const list = byGroup.get(g) ?? [];
    list.push(row);
    byGroup.set(g, list);
  }

  const groupResults: Record<string, GroupResult[]> = {};
  const allThirdCandidates: ThirdPlaceCandidate[] = [];

  for (const [group, rows] of byGroup) {
    const sorted = [...rows].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
    const winner = sorted.find((r) => r.rank === 1);
    const runner = sorted.find((r) => r.rank === 2);
    const third = sorted.find((r) => r.rank === 3);

    if (winner && runner) {
      groupResults[group] = [
        {
          team: teamFromStanding(winner, teamById),
          points: winner.points ?? 0,
          gd: winner.goal_difference ?? 0,
          goalsFor: winner.goals_for ?? 0,
          position: 1,
        },
        {
          team: teamFromStanding(runner, teamById),
          points: runner.points ?? 0,
          gd: runner.goal_difference ?? 0,
          goalsFor: runner.goals_for ?? 0,
          position: 2,
        },
      ];
    }

    if (third) {
      allThirdCandidates.push({
        team: teamFromStanding(third, teamById),
        points: third.points ?? 0,
        gd: third.goal_difference ?? 0,
        goalsFor: third.goals_for ?? 0,
      });
    }
  }

  const qualifiedThirds = get8BestThirds(allThirdCandidates);
  const qualifiedThirdGroups = new Set(qualifiedThirds.map((t) => t.group));

  return { groupResults, allThirdCandidates, qualifiedThirdGroups };
}

export function buildR32BracketSlots(
  groupResults: Record<string, GroupResult[]>,
  allThirdCandidates: ThirdPlaceCandidate[],
): (BracketTeamRecord | null)[] {
  const bracket: (BracketTeamRecord | null)[] = new Array(32).fill(null);

  const W: Record<string, BracketTeamRecord> = {};
  const R: Record<string, BracketTeamRecord> = {};
  for (const g of Object.keys(groupResults)) {
    W[g] = groupResults[g][0].team;
    R[g] = groupResults[g][1].team;
  }

  for (const { slot, group, pos } of WINNER_SLOTS) {
    bracket[slot] = pos === "W" ? (W[group] ?? null) : (R[group] ?? null);
  }

  const groupsComplete = Object.keys(groupResults).length === 12;
  if (groupsComplete && allThirdCandidates.length >= 8) {
    try {
      const qualified = get8BestThirds(allThirdCandidates);
      const thirdAssignment = assignThirdsToSlots(qualified);
      for (const [slot, team] of thirdAssignment) {
        bracket[slot] = team;
      }
    } catch {
      // partial third-place assignment — slots keep placeholders
    }
  }

  return bracket;
}
