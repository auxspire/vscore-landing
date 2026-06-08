import { TEAMS, GROUPS, TEAMS_BY_ID, type Team } from "../data/teams";

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

interface GroupResult {
  team: Team;
  points: number;
  gd: number;
  position: number;
}

function simulateGroup(teams: Team[]): GroupResult[] {
  const stats: Record<string, { points: number; gd: number }> = {};
  for (const t of teams) stats[t.id] = { points: 0, gd: 0 };

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const a = teams[i];
      const b = teams[j];
      const outcome = matchOutcome(a, b);
      const eloGap = Math.abs(a.eloRating - b.eloRating) / 200;
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
    if (sb.gd !== sa.gd) return sb.gd - sa.gd;
    return b.eloRating - a.eloRating;
  });

  return sorted.map((team, i) => ({ team, points: stats[team.id].points, gd: stats[team.id].gd, position: i + 1 }));
}

function get8BestThirds(thirds: Array<{ team: Team; points: number; gd: number }>): Team[] {
  return [...thirds]
    .sort((a, b) => b.points !== a.points ? b.points - a.points : b.gd !== a.gd ? b.gd - a.gd : b.team.eloRating - a.team.eloRating)
    .slice(0, 8)
    .map(r => r.team);
}

function buildBracket(groupResults: Record<string, GroupResult[]>, thirds: Array<{ team: Team; points: number; gd: number }>): Team[] {
  const groupLetters = "ABCDEFGHIJKL".split("");
  const firsts: Team[] = [];
  const seconds: Team[] = [];
  const thirdsList: { team: Team; points: number; gd: number }[] = [];

  for (const g of groupLetters) {
    const r = groupResults[g];
    if (!r) continue;
    firsts.push(r[0].team);
    seconds.push(r[1].team);
    thirdsList.push({ team: r[2].team, points: r[2].points, gd: r[2].gd });
  }

  const qualifiedThirds = get8BestThirds(thirdsList);
  const others = [...seconds, ...qualifiedThirds];

  // Shuffle others for bracket variety
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }

  const bracket: Team[] = [];
  for (let i = 0; i < 12; i++) {
    bracket.push(firsts[i]);
    bracket.push(others[i]);
  }
  for (let i = 12; i < 20; i += 2) {
    bracket.push(others[i]);
    bracket.push(others[i + 1]);
  }
  return bracket;
}

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
  group_stage: "Group Stage",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarterfinal: "Quarterfinal",
  semifinal: "Semifinal",
  final: "Final",
};

const KNOCKOUT_STAGES = ["round_of_32", "round_of_16", "quarterfinal", "semifinal", "final"];

export function simulateBracketExplorer(
  teamId: string,
  numSimulations: number = 5000
): BracketExplorerData {
  const team = TEAMS_BY_ID[teamId];
  if (!team) throw new Error(`Team not found: ${teamId}`);

  const groupLetters = "ABCDEFGHIJKL".split("");

  const stageData: Record<string, BracketStageData> = {};
  for (const stage of [...KNOCKOUT_STAGES]) {
    stageData[stage] = {
      stage,
      description: STAGE_DESCRIPTIONS[stage] || stage,
      reachCount: 0,
      opponents: {},
    };
  }

  let winCount = 0;

  for (let sim = 0; sim < numSimulations; sim++) {
    // Simulate all groups
    const groupResults: Record<string, GroupResult[]> = {};
    for (const g of groupLetters) {
      groupResults[g] = simulateGroup(GROUPS[g]);
    }

    const thirds = groupLetters.map(g => {
      const r = groupResults[g][2];
      return { team: r.team, points: r.points, gd: r.gd };
    });

    const bracket = buildBracket(groupResults, thirds);

    // Check if target team is in the bracket
    if (!bracket.some(t => t.id === teamId)) continue;

    // Simulate knockout, tracking target team's path
    let currentRound = [...bracket];
    let teamSurvived = true;

    for (const stage of KNOCKOUT_STAGES) {
      const nextRound: Team[] = [];
      let foundInRound = false;

      for (let i = 0; i < currentRound.length; i += 2) {
        const a = currentRound[i];
        const b = currentRound[i + 1];
        const winner = knockoutWinner(a, b);
        nextRound.push(winner);

        // Track the target team's opponent at this stage
        if (a.id === teamId || b.id === teamId) {
          foundInRound = true;
          stageData[stage].reachCount++;
          const opponent = a.id === teamId ? b : a;

          if (!stageData[stage].opponents[opponent.id]) {
            stageData[stage].opponents[opponent.id] = {
              team: opponent,
              encounterCount: 0,
              winsIfFacing: 0,
            };
          }
          stageData[stage].opponents[opponent.id].encounterCount++;
          if (winner.id === teamId) {
            stageData[stage].opponents[opponent.id].winsIfFacing++;
          }
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
