import { TEAMS, GROUPS, type Team } from "../data/teams";

// --- Elo-based match probability ---

/**
 * Returns probability that teamA beats teamB in 90 minutes (or extra time).
 * Uses Elo formula: P(A wins) = 1 / (1 + 10^((Rb - Ra) / 400))
 * Draws are included for group stage.
 */
function matchOutcome(
  teamA: Team,
  teamB: Team
): "A" | "B" | "D" {
  const pa = 1 / (1 + Math.pow(10, (teamB.eloRating - teamA.eloRating) / 400));

  // Draw probability increases when teams are closely matched
  const drawProb = 0.18 + 0.20 * (1 - Math.abs(2 * pa - 1));
  const adjustedPa = pa * (1 - drawProb);
  const adjustedPb = (1 - pa) * (1 - drawProb);

  const r = Math.random();
  if (r < adjustedPa) return "A";
  if (r < adjustedPa + drawProb) return "D";
  return "B";
}

/**
 * Knockout match — no draws allowed; use extra time/penalties probability
 */
function knockoutWinner(teamA: Team, teamB: Team): Team {
  const pa = 1 / (1 + Math.pow(10, (teamB.eloRating - teamA.eloRating) / 400));
  return Math.random() < pa ? teamA : teamB;
}

// --- Group stage simulation ---

interface GroupResult {
  team: Team;
  points: number;
  gd: number; // goal difference (simulated)
  position: number; // 1st, 2nd, 3rd, 4th in group
}

function simulateGroup(teams: Team[]): GroupResult[] {
  const stats: Record<string, { points: number; gd: number }> = {};
  for (const t of teams) stats[t.id] = { points: 0, gd: 0 };

  // Round-robin: each pair plays once
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const a = teams[i];
      const b = teams[j];
      const outcome = matchOutcome(a, b);

      // Simulate rough goal difference (for tiebreaking)
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
    const sa = stats[a.id];
    const sb = stats[b.id];
    if (sb.points !== sa.points) return sb.points - sa.points;
    if (sb.gd !== sa.gd) return sb.gd - sa.gd;
    return b.eloRating - a.eloRating; // Elo as final tiebreaker
  });

  return sorted.map((team, i) => ({
    team,
    points: stats[team.id].points,
    gd: stats[team.id].gd,
    position: i + 1,
  }));
}

// --- 2026 World Cup format ---
// 48 teams, 12 groups of 4
// Top 2 from each group = 24 advance
// Best 8 third-place teams advance
// Total: 32 teams advance to Round of 32

function get8BestThirds(thirdPlaceTeams: Array<{ team: Team; points: number; gd: number }>): Team[] {
  const sorted = [...thirdPlaceTeams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.team.eloRating - a.team.eloRating;
  });
  return sorted.slice(0, 8).map((r) => r.team);
}

// 2026 R32 bracket pairings (simplified — based on FIFA seeding logic)
// Groups A-L, winners/runners-up slot into bracket positions
// We'll use a fixed bracket structure:
// Slot 1-16: bracket top half, Slot 17-32: bracket bottom half
// Within each half, teams are paired as 1v2, 3v4, 5v6, 7v8 etc.

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function hasSameGroupPair(firsts: Team[], others: Team[]): boolean {
  // Check the 12 first-vs-other matches
  for (let i = 0; i < 12; i++) {
    if (firsts[i].group === others[i].group) return true;
  }
  // Check the 4 other-vs-other matches (indices 12..19, paired as 12-13, 14-15, 16-17, 18-19)
  for (let i = 12; i < 20; i += 2) {
    if (others[i].group === others[i + 1].group) return true;
  }
  return false;
}

function buildBracket(groupResults: Record<string, GroupResult[]>, best8Thirds: Array<{ team: Team; points: number; gd: number }>): Team[] {
  const firstPlace: Team[] = [];
  const secondPlace: Team[] = [];
  const thirdPlace: { team: Team; points: number; gd: number }[] = [];

  const groupLetters = "ABCDEFGHIJKL".split("");
  for (const g of groupLetters) {
    const results = groupResults[g];
    if (!results) continue;
    firstPlace.push(results[0].team);
    secondPlace.push(results[1].team);
    thirdPlace.push({ team: results[2].team, points: results[2].points, gd: results[2].gd });
  }

  const qualifiedThirds = get8BestThirds(thirdPlace);

  // others = all 2nd-place teams + 8 qualified 3rd-place teams (20 total)
  // Shuffle with constraint: no R32 pair may contain two same-group teams.
  //   - pairs 0..11: firsts[i] vs others[i]
  //   - pairs 12..15: others[12] vs others[13], others[14] vs others[15], ...
  const others = [...secondPlace, ...qualifiedThirds];

  let attempts = 0;
  do {
    shuffle(others);
    attempts++;
  } while (hasSameGroupPair(firstPlace, others) && attempts < 300);

  // Fallback: if rejection sampling somehow didn't converge, force-fix by swapping
  // any conflicting pair with the nearest non-conflicting candidate.
  if (hasSameGroupPair(firstPlace, others)) {
    for (let i = 0; i < 20; i++) {
      const pairedGroup = i < 12 ? firstPlace[i].group : others[i % 2 === 0 ? i : i - 1].group;
      if (others[i].group === pairedGroup) {
        for (let j = i + 1; j < 20; j++) {
          const jPairedGroup = j < 12 ? firstPlace[j].group : others[j % 2 === 0 ? j : j - 1].group;
          if (others[j].group !== pairedGroup && others[i].group !== jPairedGroup) {
            [others[i], others[j]] = [others[j], others[i]];
            break;
          }
        }
      }
    }
  }

  const bracket: Team[] = [];
  for (let i = 0; i < 12; i++) {
    bracket.push(firstPlace[i]);
    bracket.push(others[i]);
  }
  for (let i = 12; i < 20; i += 2) {
    bracket.push(others[i]);
    bracket.push(others[i + 1]);
  }

  return bracket;
}

function simulateKnockout(
  bracket: Team[],
  targetA: Team,
  targetB: Team,
  stageCounts: Record<string, number>
): void {
  // bracket has 32 teams; pairs are (0,1), (2,3), (4,5), ...
  const stages = ["round_of_32", "round_of_16", "quarterfinal", "semifinal", "final"];

  let currentRound = [...bracket];
  let roundIndex = 0;

  while (currentRound.length > 1 && roundIndex < stages.length) {
    const stage = stages[roundIndex];
    const nextRound: Team[] = [];

    for (let i = 0; i < currentRound.length; i += 2) {
      const a = currentRound[i];
      const b = currentRound[i + 1];

      // Check if A meets B at this stage
      const hasA = a.id === targetA.id || b.id === targetA.id;
      const hasB = a.id === targetB.id || b.id === targetB.id;
      if (hasA && hasB) {
        stageCounts[stage] = (stageCounts[stage] || 0) + 1;
      }

      const winner = knockoutWinner(a, b);
      nextRound.push(winner);
    }

    currentRound = nextRound;
    roundIndex++;
  }
}

// --- Main simulation ---

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
  semifinal: "Semifinal",
  final: "Final",
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
  numSimulations: number = 10000
): SimulationResult {
  const teamA = TEAMS.find((t) => t.id === teamAId);
  const teamB = TEAMS.find((t) => t.id === teamBId);

  if (!teamA || !teamB) {
    throw new Error(`Team not found: ${teamAId} or ${teamBId}`);
  }

  const sameGroup = teamA.group === teamB.group;

  const stageCounts: Record<string, number> = {
    group_stage: 0,
    round_of_32: 0,
    round_of_16: 0,
    quarterfinal: 0,
    semifinal: 0,
    final: 0,
  };

  const groupLetters = "ABCDEFGHIJKL".split("");

  for (let sim = 0; sim < numSimulations; sim++) {
    const groupResults: Record<string, GroupResult[]> = {};

    for (const g of groupLetters) {
      const teams = GROUPS[g];
      if (!teams) continue;
      groupResults[g] = simulateGroup(teams);
    }

    // Check group stage meeting
    if (sameGroup) {
      stageCounts["group_stage"]++;
    }

    // Collect third place teams
    const thirdPlaceTeams = groupLetters.map((g) => {
      const r = groupResults[g][2];
      return { team: r.team, points: r.points, gd: r.gd };
    });

    // Build bracket
    const bracket = buildBracket(groupResults, thirdPlaceTeams);

    // Check if both teams qualified
    const aInBracket = bracket.some((t) => t.id === teamA.id);
    const bInBracket = bracket.some((t) => t.id === teamB.id);

    if (aInBracket && bInBracket) {
      simulateKnockout(bracket, teamA, teamB, stageCounts);
    }
  }

  const stages: StageProbability[] = Object.entries(stageCounts).map(
    ([stage, count]) => ({
      stage,
      probability: count / numSimulations,
      description: STAGE_DESCRIPTIONS[stage] || stage,
    })
  );

  // Sort stages in logical order
  const stageOrder = ["group_stage", "round_of_32", "round_of_16", "quarterfinal", "semifinal", "final"];
  stages.sort((a, b) => stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage));

  // Total probability: at least one meeting across all stages
  // (stages are mutually exclusive within knockout, group is additive)
  const groupProb = stageCounts["group_stage"] / numSimulations;
  const knockoutProb = ["round_of_32", "round_of_16", "quarterfinal", "semifinal", "final"].reduce(
    (acc, s) => acc + stageCounts[s] / numSimulations,
    0
  );

  // Combine: meeting in group OR knockout
  const totalProbability = groupProb + (1 - groupProb) * knockoutProb;

  return {
    stages,
    totalProbability: Math.min(1, totalProbability),
    simulationsRun: numSimulations,
    sameGroup,
  };
}

export function simulateTeamStageReach(
  teamId: string,
  numSimulations: number = 5000
): Record<string, number> {
  const team = TEAMS.find((t) => t.id === teamId);
  if (!team) throw new Error(`Team not found: ${teamId}`);

  const reachCounts: Record<string, number> = {
    group_stage: numSimulations, // always participates in group stage
    round_of_32: 0,
    round_of_16: 0,
    quarterfinal: 0,
    semifinal: 0,
    final: 0,
  };

  const groupLetters = "ABCDEFGHIJKL".split("");

  for (let sim = 0; sim < numSimulations; sim++) {
    const groupResults: Record<string, GroupResult[]> = {};
    for (const g of groupLetters) {
      groupResults[g] = simulateGroup(GROUPS[g]);
    }

    const thirdPlaceTeams = groupLetters.map((g) => {
      const r = groupResults[g][2];
      return { team: r.team, points: r.points, gd: r.gd };
    });

    const bracket = buildBracket(groupResults, thirdPlaceTeams);

    let inBracket = bracket.some((t) => t.id === teamId);
    if (!inBracket) continue;

    reachCounts["round_of_32"]++;

    // Simulate the bracket tracking team progress
    const stages = ["round_of_16", "quarterfinal", "semifinal", "final"];
    let currentRound = [...bracket];

    for (const stage of stages) {
      const nextRound: Team[] = [];
      let survived = false;

      for (let i = 0; i < currentRound.length; i += 2) {
        const a = currentRound[i];
        const b = currentRound[i + 1];
        const winner = knockoutWinner(a, b);
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
