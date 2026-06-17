import { TEAMS_BY_ID, type Team } from "../data/teams";
import { buildBracket, type GroupResult } from "./bracketBuilder";
import type { EloAdjustments } from "./liveMetrics";
import { getAdjustedTeamsContext } from "./teamAdjustments";

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

// Compact per-opponent conditional tracker (raw counts, normalised in route)
interface ConditionalStageRaw {
  reachCount: number;
  opponents: Record<string, { team: Team; encounterCount: number; winsIfFacing: number }>;
}

function bumpConditionalPath(
  store: Record<string, ConditionalStageRaw>,
  nextStage: string,
  nextOppId: string,
  teamsById: Record<string, Team>,
  wonNext: boolean,
): void {
  if (!store[nextStage]) {
    store[nextStage] = { reachCount: 0, opponents: {} };
  }
  const cp = store[nextStage];
  cp.reachCount++;
  if (!cp.opponents[nextOppId]) {
    cp.opponents[nextOppId] = { team: teamsById[nextOppId], encounterCount: 0, winsIfFacing: 0 };
  }
  cp.opponents[nextOppId].encounterCount++;
  if (wonNext) cp.opponents[nextOppId].winsIfFacing++;
}

export interface BracketOpponentData {
  team: Team;
  encounterCount: number;
  winsIfFacing: number;
  /** How the opponent typically finished in the group stage (raw counts) */
  opponentGroupFinish: Record<string, number>;
  /** How many times this opponent was faced when our team finished 1st/2nd/3rd (raw counts) */
  encountersByTeamFinish: Record<string, number>;
  /**
   * How many times our team WON against this opponent, broken down by our team's
   * finish position. Enables per-scenario win rate: winsIfFacingByTeamFinish[pos] / encountersByTeamFinish[pos].
   */
  winsIfFacingByTeamFinish: Record<string, number>;
  /**
   * Opponent's group finish broken down by our team's finish position.
   * e.g. opponentGroupFinishByTeamFinish["2nd"]["1st"] = 430
   * means: in 430 sims where our team finished 2nd, this opponent finished 1st.
   */
  opponentGroupFinishByTeamFinish: Record<string, Record<string, number>>;
  /** Given our team beat this opponent, what happened at subsequent stages */
  conditionalPath: Record<string, ConditionalStageRaw>;
  /** Same as conditionalPath but only sims where our team finished in that group position */
  conditionalPathByTeamFinish: Record<string, Record<string, ConditionalStageRaw>>;
}

export interface BracketStageData {
  stage: string;
  description: string;
  reachCount: number;
  opponents: Record<string, BracketOpponentData>;
  /** How our selected team typically finished in the group stage (raw counts) */
  teamGroupFinish: Record<string, number>;
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
  numSimulations = 5000,
  eloAdjustments?: EloAdjustments,
): BracketExplorerData {
  const { groups, teamsById } = getAdjustedTeamsContext(eloAdjustments);
  const team = teamsById[teamId];
  if (!team) throw new Error(`Team not found: ${teamId}`);

  const stageData: Record<string, BracketStageData> = {};
  for (const stage of KNOCKOUT_STAGES) {
    stageData[stage] = {
      stage,
      description: STAGE_DESCRIPTIONS[stage] || stage,
      reachCount: 0,
      opponents: {},
      teamGroupFinish: {},
    };
  }

  let winCount = 0;

  for (let sim = 0; sim < numSimulations; sim++) {
    // ── Group stage ────────────────────────────────────────────────────────
    const groupResults: Record<string, GroupResult[]> = {};
    for (const g of GROUP_LETTERS) {
      groupResults[g] = simulateGroup(groups[g]);
    }

    // Build position lookup for every team: "1st" / "2nd" / "3rd"
    const groupPos: Record<string, string> = {};
    for (const g of GROUP_LETTERS) {
      groupResults[g].forEach((r, i) => {
        groupPos[r.team.id] = i === 0 ? "1st" : i === 1 ? "2nd" : "3rd";
      });
    }

    const teamGroupPos = groupPos[teamId];

    const allThirds = GROUP_LETTERS.map(g => {
      const r = groupResults[g][2];
      return { team: r.team, points: r.points, gd: r.gd };
    });

    const bracket = buildBracket(groupResults, allThirds);
    if (!bracket.some(t => t.id === teamId)) continue;

    // ── Knockout stages ────────────────────────────────────────────────────
    let currentRound = [...bracket];

    // Record which opponent was faced (and whether we won) at each stage
    const simPath: Array<{ stage: string; opponentId: string; teamWon: boolean }> = [];

    for (const stage of KNOCKOUT_STAGES) {
      const nextRound: Team[] = [];
      let foundInRound = false;

      for (let i = 0; i < currentRound.length; i += 2) {
        const a = currentRound[i], b = currentRound[i + 1];
        const winner = knockoutWinner(a, b);
        nextRound.push(winner);

        if (a.id === teamId || b.id === teamId) {
          foundInRound = true;
          const sd = stageData[stage];
          sd.reachCount++;

          // Selected team's group finish
          if (teamGroupPos) {
            sd.teamGroupFinish[teamGroupPos] = (sd.teamGroupFinish[teamGroupPos] || 0) + 1;
          }

          const opponent = a.id === teamId ? b : a;
          const teamWon  = winner.id === teamId;

          if (!sd.opponents[opponent.id]) {
            sd.opponents[opponent.id] = {
              team: opponent,
              encounterCount: 0,
              winsIfFacing: 0,
              opponentGroupFinish: {},
              encountersByTeamFinish: {},
              winsIfFacingByTeamFinish: {},
              opponentGroupFinishByTeamFinish: {},
              conditionalPath: {},
              conditionalPathByTeamFinish: {},
            };
          }
          const oppData = sd.opponents[opponent.id];
          oppData.encounterCount++;
          if (teamWon) oppData.winsIfFacing++;

          // Opponent's group finish (overall)
          const oppPos = groupPos[opponent.id];
          if (oppPos) {
            oppData.opponentGroupFinish[oppPos] = (oppData.opponentGroupFinish[oppPos] || 0) + 1;
          }

          // Track per-finish-position encounter and win counts
          if (teamGroupPos) {
            oppData.encountersByTeamFinish[teamGroupPos] =
              (oppData.encountersByTeamFinish[teamGroupPos] || 0) + 1;

            // Per-scenario wins: how many times we beat this opponent when we finished `teamGroupPos`
            if (teamWon) {
              oppData.winsIfFacingByTeamFinish[teamGroupPos] =
                (oppData.winsIfFacingByTeamFinish[teamGroupPos] || 0) + 1;
            }

            // Also track opponent's group finish broken down by our team's finish
            if (oppPos) {
              if (!oppData.opponentGroupFinishByTeamFinish[teamGroupPos]) {
                oppData.opponentGroupFinishByTeamFinish[teamGroupPos] = {};
              }
              const byPos = oppData.opponentGroupFinishByTeamFinish[teamGroupPos];
              byPos[oppPos] = (byPos[oppPos] || 0) + 1;
            }
          }

          simPath.push({ stage, opponentId: opponent.id, teamWon });
        }
      }

      if (!foundInRound || !nextRound.some(t => t.id === teamId)) break;
      currentRound = nextRound;
    }

    const lastEntry = simPath[simPath.length - 1];
    if (lastEntry?.stage === "final" && lastEntry.teamWon) winCount++;

    // ── Conditional path tracking ──────────────────────────────────────────
    // For each stage i where our team WON, record what happened at stages i+1 …
    for (let i = 0; i < simPath.length - 1; i++) {
      const { stage: rootStage, opponentId: rootOppId, teamWon: wonRoot } = simPath[i];
      if (!wonRoot) continue;

      const rootOppData = stageData[rootStage].opponents[rootOppId];

      for (let j = i + 1; j < simPath.length; j++) {
        const { stage: nextStage, opponentId: nextOppId, teamWon: wonNext } = simPath[j];

        bumpConditionalPath(rootOppData.conditionalPath, nextStage, nextOppId, teamsById, wonNext);

        if (teamGroupPos) {
          if (!rootOppData.conditionalPathByTeamFinish[teamGroupPos]) {
            rootOppData.conditionalPathByTeamFinish[teamGroupPos] = {};
          }
          bumpConditionalPath(
            rootOppData.conditionalPathByTeamFinish[teamGroupPos],
            nextStage,
            nextOppId,
            teamsById,
            wonNext,
          );
        }
      }
    }
  }

  return { team, stageData, winCount, simulationsRun: numSimulations };
}
