import { TEAMS, GROUPS, TEAMS_BY_ID, type Team } from "../data/teams";
import { buildBracket, type GroupResult } from "./bracketBuilder";

// ─── Elo match utilities ───────────────────────────────────────────────────

function eloWinProb(teamA: Team, teamB: Team): number {
  return 1 / (1 + Math.pow(10, (teamB.eloRating - teamA.eloRating) / 400));
}

function matchOutcome(teamA: Team, teamB: Team): "A" | "B" | "D" {
  const pa = eloWinProb(teamA, teamB);
  const drawProb = 0.18 + 0.2 * (1 - Math.abs(2 * pa - 1));
  const adjPa = pa * (1 - drawProb);
  const r = Math.random();
  if (r < adjPa) return "A";
  if (r < adjPa + drawProb) return "D";
  return "B";
}

function knockoutWinner(a: Team, b: Team): Team {
  return Math.random() < eloWinProb(a, b) ? a : b;
}

// ─── Group stage simulation ────────────────────────────────────────────────

function simulateGroup(teams: Team[]): GroupResult[] {
  const stats: Record<string, { points: number; gd: number }> = {};
  for (const t of teams) stats[t.id] = { points: 0, gd: 0 };

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const a = teams[i], b = teams[j];
      const outcome = matchOutcome(a, b);
      const eloGap = Math.abs(a.eloRating - b.eloRating) / 200;
      const baseGd = Math.round(Math.random() * 2 + Math.abs(eloGap));
      if (outcome === "A") {
        stats[a.id].points += 3; stats[a.id].gd += baseGd; stats[b.id].gd -= baseGd;
      } else if (outcome === "B") {
        stats[b.id].points += 3; stats[b.id].gd += baseGd; stats[a.id].gd -= baseGd;
      } else {
        stats[a.id].points += 1; stats[b.id].points += 1;
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
    team, points: stats[team.id].points, gd: stats[team.id].gd, position: i + 1,
  }));
}

// ─── Public interfaces ─────────────────────────────────────────────────────

export interface BracketOpponentData {
  team: Team;
  encounterCount: number;
  winsIfFacing: number;
}

export interface BracketStageData {
  stage: string;
  description: string;
  reachCount: number;
  opponents: Record<string, BracketOpponentData>;
}

export interface BracketExplorerData {
  team: Team;
  stageData: Record<string, BracketStageData>;
  winCount: number;
  simulationsRun: number;
}

const STAGE_DESCRIPTIONS: Record<string, string> = {
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarterfinal: "Quarterfinal",
  semifinal:    "Semifinal",
  final:        "Final",
};

const KNOCKOUT_STAGES = ["round_of_32", "round_of_16", "quarterfinal", "semifinal", "final"];
const GROUP_LETTERS   = "ABCDEFGHIJKL".split("");

// ─── Main simulation ───────────────────────────────────────────────────────

export function simulateBracketExplorer(
  teamId: string,
  numSimulations = 5000
): BracketExplorerData {
  const team = TEAMS_BY_ID[teamId];
  if (!team) throw new Error(`Team not found: ${teamId}`);

  const stageData: Record<string, BracketStageData> = {};
  for (const stage of KNOCKOUT_STAGES) {
    stageData[stage] = {
      stage,
      description: STAGE_DESCRIPTIONS[stage] || stage,
      reachCount: 0,
      opponents: {},
    };
  }

  let winCount = 0;

  for (let sim = 0; sim < numSimulations; sim++) {
    const groupResults: Record<string, GroupResult[]> = {};
    for (const g of GROUP_LETTERS) {
      groupResults[g] = simulateGroup(GROUPS[g]);
    }

    const allThirds = GROUP_LETTERS.map(g => {
      const r = groupResults[g][2];
      return { team: r.team, points: r.points, gd: r.gd };
    });

    const bracket = buildBracket(groupResults, allThirds);
    if (!bracket.some(t => t.id === teamId)) continue;

    let currentRound = [...bracket];
    let teamSurvived = true;

    for (const stage of KNOCKOUT_STAGES) {
      const nextRound: Team[] = [];
      let foundInRound = false;

      for (let i = 0; i < currentRound.length; i += 2) {
        const a = currentRound[i], b = currentRound[i + 1];
        const winner = knockoutWinner(a, b);
        nextRound.push(winner);

        if (a.id === teamId || b.id === teamId) {
          foundInRound = true;
          stageData[stage].reachCount++;
          const opponent = a.id === teamId ? b : a;

          if (!stageData[stage].opponents[opponent.id]) {
            stageData[stage].opponents[opponent.id] = {
              team: opponent, encounterCount: 0, winsIfFacing: 0,
            };
          }
          stageData[stage].opponents[opponent.id].encounterCount++;
          if (winner.id === teamId) stageData[stage].opponents[opponent.id].winsIfFacing++;
        }
      }

      if (!foundInRound || !nextRound.some(t => t.id === teamId)) {
        teamSurvived = false;
        break;
      }

      currentRound = nextRound;
    }

    if (teamSurvived && currentRound.length === 1 && currentRound[0].id === teamId) {
      winCount++;
    }
  }

  return { team, stageData, winCount, simulationsRun: numSimulations };
}
