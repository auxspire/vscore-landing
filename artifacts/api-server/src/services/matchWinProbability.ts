import type { Team } from "../data/teams";
import { getAdjustedTeamsContext } from "./teamAdjustments";
import type { EloAdjustments } from "./liveMetrics";

export interface MatchOutcomeProbabilities {
  homeWin: number;
  draw: number;
  awayWin: number;
  favoredTeamId: string;
  favoredSide: "home" | "away" | "draw";
  favoredWinProbability: number;
  isKnockout: boolean;
}

function eloWinProb(teamA: Team, teamB: Team): number {
  return 1 / (1 + Math.pow(10, (teamB.eloRating - teamA.eloRating) / 400));
}

export function computeMatchOutcomeProbabilities(
  home: Team,
  away: Team,
  isKnockout: boolean,
): MatchOutcomeProbabilities {
  const homeRaw = eloWinProb(home, away);
  const awayRaw = 1 - homeRaw;

  if (isKnockout) {
    const total = homeRaw + awayRaw;
    const homeWin = homeRaw / total;
    const awayWin = awayRaw / total;
    const favoredSide = homeWin >= awayWin ? "home" : "away";
    const favoredTeamId = favoredSide === "home" ? home.id : away.id;
    return {
      homeWin,
      draw: 0,
      awayWin,
      favoredTeamId,
      favoredSide,
      favoredWinProbability: Math.max(homeWin, awayWin),
      isKnockout: true,
    };
  }

  const draw = 0.18 + 0.2 * (1 - Math.abs(2 * homeRaw - 1));
  const homeWin = homeRaw * (1 - draw);
  const awayWin = awayRaw * (1 - draw);

  let favoredSide: "home" | "away" | "draw" = "home";
  let favoredWinProbability = homeWin;
  let favoredTeamId = home.id;

  if (awayWin > homeWin && awayWin >= draw) {
    favoredSide = "away";
    favoredWinProbability = awayWin;
    favoredTeamId = away.id;
  } else if (draw > homeWin && draw > awayWin) {
    favoredSide = "draw";
    favoredWinProbability = draw;
    favoredTeamId = "draw";
  }

  return {
    homeWin,
    draw,
    awayWin,
    favoredTeamId,
    favoredSide,
    favoredWinProbability,
    isKnockout: false,
  };
}

export type ActualOutcome = "home" | "away" | "draw";

export function actualOutcomeFromScore(
  homeGoals: number,
  awayGoals: number,
): ActualOutcome {
  if (homeGoals > awayGoals) return "home";
  if (awayGoals > homeGoals) return "away";
  return "draw";
}

export interface PredictionAccuracy {
  actualOutcome: ActualOutcome;
  predictionCorrect: boolean;
  isUpset: boolean;
}

export function assessPredictionAccuracy(
  probs: MatchOutcomeProbabilities,
  homeGoals: number,
  awayGoals: number,
): PredictionAccuracy {
  const actualOutcome = actualOutcomeFromScore(homeGoals, awayGoals);
  const predictionCorrect =
    probs.favoredSide === "draw"
      ? actualOutcome === "draw"
      : actualOutcome === probs.favoredSide;

  const isUpset =
    !predictionCorrect &&
    actualOutcome !== "draw" &&
    probs.favoredSide !== "draw";

  return { actualOutcome, predictionCorrect, isUpset };
}

export function getAdjustedTeam(
  teamId: string,
  adjustments?: EloAdjustments,
): Team | undefined {
  const { teamsById } = getAdjustedTeamsContext(adjustments);
  return teamsById[teamId];
}
