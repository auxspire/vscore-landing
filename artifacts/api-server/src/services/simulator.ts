import { TEAMS, GROUPS, type Team } from "../data/teams";
import { buildBracket, type GroupResult } from "./bracketBuilder";
import type { EloAdjustments } from "./liveMetrics";
import { getAdjustedTeamsContext } from "./teamAdjustments";

// ─── Elo match utilities ───────────────────────────────────────────────────

function matchOutcome(teamA: Team, teamB: Team): "A" | "B" | "D" {
  const pa = 1 / (1 + Math.pow(10, (teamB.eloRating - teamA.eloRating) / 400));
  const drawProb = 0.18 + 0.20 * (1 - Math.abs(2 * pa - 1));
  const adjustedPa = pa * (1 - drawProb);
  const r = Math.random();
  if (r < adjustedPa) return "A";
  if (r < adjustedPa + drawProb) return "D";
  return "B";
}

function knockoutWinner(teamA: Team, teamB: Team): Team {
  const pa = 1 / (1 + Math.pow(10, (teamB.eloRating - teamA.eloRating) / 400));
  return Math.random() < pa ? teamA : teamB;
}

// ─── Group stage simulation ────────────────────────────────────────────────

function simulateGroup(teams: Team[]): GroupResult[] {
  const stats: Record<string, { points: number; gd: number }> = {};
  for (const t of teams) stats[t.id] = { points: 0, gd: 0 };

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const a = teams[i];
      const b = teams[j];
      const outcome = matchOutcome(a, b);
      const eloGap = (a.eloRating - b.eloRating) / 200;
      const baseGd = Math.round(Math.random() * 2 + Math.abs(eloGap));

      if (outcome === "A") {
        stats[a.id].points += 3;
        stats[a.id].gd += baseGd;
        stats[b.id].gd -= baseGd;
      } else if (outcome === "B") {
        stats[b.id].points += 3;
        stats[b.id].gd += baseGd;
        stats[a.id].gd -= baseGd;
      } else {
        stats[a.id].points += 1;
        stats[b.id].points += 1;
      }
    }
  }

  const sorted = [...teams].sort((a, b) => {
    const sa = stats[a.id], sb = stats[b.id];
    if (sb.points !== sa.points) return sb.points - sa.points;
    if (sb.gd    !== sa.gd)      return sb.gd    - sa.gd;
    return b.eloRating - a.eloRating;
  });

  return sorted.map((team, i) => ({
    team,
    points:   stats[team.id].points,
    gd:       stats[team.id].gd,
    position: i + 1,
  }));
}

// ─── Knockout bracket simulation ──────────────────────────────────────────

function simulateKnockout(
  bracket: Team[],
  targetA: Team,
  targetB: Team,
  stageCounts: Record<string, number>
): void {
  const stages = ["round_of_32", "round_of_16", "quarterfinal", "semifinal", "final"];
  let currentRound = [...bracket];

  for (let roundIndex = 0; roundIndex < stages.length && currentRound.length > 1; roundIndex++) {
    const stage = stages[roundIndex];
    const nextRound: Team[] = [];

    for (let i = 0; i < currentRound.length; i += 2) {
      const a = currentRound[i];
      const b = currentRound[i + 1];

      if (
        (a.id === targetA.id || b.id === targetA.id) &&
        (a.id === targetB.id || b.id === targetB.id)
      ) {
        stageCounts[stage] = (stageCounts[stage] || 0) + 1;
      }

      nextRound.push(knockoutWinner(a, b));
    }

    currentRound = nextRound;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────

export interface StageProbability {
  stage: string;
  probability: number;
  description: string;
}

const STAGE_DESCRIPTIONS: Record<string, string> = {
  group_stage: "Group Stage (guaranteed if in same group)",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarterfinal: "Quarterfinal",
  semifinal:    "Semifinal",
  final:        "Final",
};

export interface SimulationResult {
  stages: StageProbability[];
  totalProbability: number;
  simulationsRun: number;
  sameGroup: boolean;
}

export function simulateMatchProbability(
  teamAId: string,
  teamBId: string,
  numSimulations = 10000,
  eloAdjustments?: EloAdjustments,
): SimulationResult {
  const { teams, groups } = getAdjustedTeamsContext(eloAdjustments);
  const teamA = teams.find(t => t.id === teamAId);
  const teamB = teams.find(t => t.id === teamBId);
  if (!teamA || !teamB) throw new Error(`Team not found: ${teamAId} or ${teamBId}`);

  const sameGroup = teamA.group === teamB.group;

  const stageCounts: Record<string, number> = {
    group_stage: 0, round_of_32: 0, round_of_16: 0,
    quarterfinal: 0, semifinal: 0, final: 0,
  };

  const groupLetters = "ABCDEFGHIJKL".split("");

  for (let sim = 0; sim < numSimulations; sim++) {
    const groupResults: Record<string, GroupResult[]> = {};
    for (const g of groupLetters) {
      groupResults[g] = simulateGroup(groups[g]);
    }

    if (sameGroup) stageCounts["group_stage"]++;

    const allThirds = groupLetters.map(g => {
      const r = groupResults[g][2];
      return { team: r.team, points: r.points, gd: r.gd };
    });

    const bracket = buildBracket(groupResults, allThirds);

    if (bracket.some(t => t.id === teamA.id) && bracket.some(t => t.id === teamB.id)) {
      simulateKnockout(bracket, teamA, teamB, stageCounts);
    }
  }

  const stageOrder = ["group_stage", "round_of_32", "round_of_16", "quarterfinal", "semifinal", "final"];

  const stages: StageProbability[] = stageOrder.map(stage => ({
    stage,
    probability: stageCounts[stage] / numSimulations,
    description: STAGE_DESCRIPTIONS[stage] || stage,
  }));

  const groupProb    = stageCounts["group_stage"] / numSimulations;
  const knockoutProb = ["round_of_32", "round_of_16", "quarterfinal", "semifinal", "final"]
    .reduce((acc, s) => acc + stageCounts[s] / numSimulations, 0);

  return {
    stages,
    totalProbability:  Math.min(1, groupProb + (1 - groupProb) * knockoutProb),
    simulationsRun:    numSimulations,
    sameGroup,
  };
}

// ─── All-teams batch rankings ─────────────────────────────────────────────

export interface TeamRankingData {
  teamId:              string;
  winProbability:      number;
  finalProbability:    number;
  semifinalProbability: number;
  quarterProbability:  number;
  r16Probability:      number;
  r32Probability:      number;
}

export function simulateAllTeamsRankings(
  numSimulations = 10000,
  eloAdjustments?: EloAdjustments,
): TeamRankingData[] {
  const { teams, groups } = getAdjustedTeamsContext(eloAdjustments);
  const groupLetters = "ABCDEFGHIJKL".split("");

  const counts: Record<string, Record<string, number>> = {};
  for (const t of teams) {
    counts[t.id] = { r32: 0, r16: 0, qf: 0, sf: 0, final: 0, win: 0 };
  }

  for (let sim = 0; sim < numSimulations; sim++) {
    const groupResults: Record<string, GroupResult[]> = {};
    for (const g of groupLetters) {
      groupResults[g] = simulateGroup(groups[g]);
    }

    const allThirds = groupLetters.map(g => {
      const r = groupResults[g][2];
      return { team: r.team, points: r.points, gd: r.gd };
    });

    const bracket = buildBracket(groupResults, allThirds);

    // All bracket qualifiers reach R32
    for (const t of bracket) counts[t.id].r32++;

    // Simulate knockout rounds, track every team's progress
    const stageKeys = ["r16", "qf", "sf", "final", "win"] as const;
    let currentRound = [...bracket];

    for (let roundIdx = 0; roundIdx < 5 && currentRound.length > 1; roundIdx++) {
      const nextRound: Team[] = [];
      for (let i = 0; i < currentRound.length; i += 2) {
        const winner = knockoutWinner(currentRound[i], currentRound[i + 1]);
        nextRound.push(winner);
      }
      currentRound = nextRound;
      const key = stageKeys[roundIdx];
      for (const t of currentRound) counts[t.id][key]++;
    }
  }

  return teams.map(t => ({
    teamId:               t.id,
    winProbability:       counts[t.id].win   / numSimulations,
    finalProbability:     counts[t.id].final / numSimulations,
    semifinalProbability: counts[t.id].sf    / numSimulations,
    quarterProbability:   counts[t.id].qf    / numSimulations,
    r16Probability:       counts[t.id].r16   / numSimulations,
    r32Probability:       counts[t.id].r32   / numSimulations,
  })).sort((a, b) => b.winProbability - a.winProbability);
}

export function simulateTeamStageReach(
  teamId: string,
  numSimulations = 5000,
  eloAdjustments?: EloAdjustments,
): Record<string, number> {
  const { teams, groups } = getAdjustedTeamsContext(eloAdjustments);
  const team = teams.find(t => t.id === teamId);
  if (!team) throw new Error(`Team not found: ${teamId}`);

  const reachCounts: Record<string, number> = {
    group_stage: numSimulations,
    round_of_32: 0, round_of_16: 0, quarterfinal: 0, semifinal: 0, final: 0,
  };

  const groupLetters = "ABCDEFGHIJKL".split("");

  for (let sim = 0; sim < numSimulations; sim++) {
    const groupResults: Record<string, GroupResult[]> = {};
    for (const g of groupLetters) {
      groupResults[g] = simulateGroup(groups[g]);
    }

    const allThirds = groupLetters.map(g => {
      const r = groupResults[g][2];
      return { team: r.team, points: r.points, gd: r.gd };
    });

    const bracket = buildBracket(groupResults, allThirds);
    if (!bracket.some(t => t.id === teamId)) continue;

    reachCounts["round_of_32"]++;

    const knockoutStages = ["round_of_16", "quarterfinal", "semifinal", "final"];
    let currentRound = [...bracket];

    for (const stage of knockoutStages) {
      const nextRound: Team[] = [];
      let survived = false;

      for (let i = 0; i < currentRound.length; i += 2) {
        const winner = knockoutWinner(currentRound[i], currentRound[i + 1]);
        nextRound.push(winner);
        if (winner.id === teamId) survived = true;
      }

      if (!survived) break;
      reachCounts[stage]++;
      currentRound = nextRound;
    }
  }

  return Object.fromEntries(
    Object.entries(reachCounts).map(([k, v]) => [k, v / numSimulations])
  );
}
