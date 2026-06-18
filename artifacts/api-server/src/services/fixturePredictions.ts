import {
  assessPredictionAccuracy,
  computeMatchOutcomeProbabilities,
  getAdjustedTeam,
  type MatchOutcomeProbabilities,
} from "./matchWinProbability";
import { resolveSimulatorTeam } from "./simulatorTeamResolver";
import type { EloAdjustments } from "./liveMetrics";

export interface FixturePredictionInput {
  fixtureId: string;
  homeFifaCode?: string | null;
  homeName?: string | null;
  awayFifaCode?: string | null;
  awayName?: string | null;
  matchType?: string | null;
  isFinished?: boolean;
  homeGoals?: number | null;
  awayGoals?: number | null;
}

export interface FixturePredictionResult {
  fixtureId: string;
  available: boolean;
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeamName?: string;
  awayTeamName?: string;
  homeWin: number;
  draw: number;
  awayWin: number;
  favoredTeamId: string;
  favoredSide: "home" | "away" | "draw";
  favoredWinProbability: number;
  favoredTeamName?: string;
  isKnockout: boolean;
  actualOutcome?: "home" | "away" | "draw";
  predictionCorrect?: boolean;
  isUpset?: boolean;
}

function isKnockoutMatch(matchType: string | null | undefined): boolean {
  return !!matchType && matchType !== "group";
}

function favoredTeamName(
  probs: MatchOutcomeProbabilities,
  homeName: string,
  awayName: string,
): string | undefined {
  if (probs.favoredSide === "draw") return undefined;
  return probs.favoredSide === "home" ? homeName : awayName;
}

export function predictFixtures(
  fixtures: FixturePredictionInput[],
  adjustments?: EloAdjustments,
): FixturePredictionResult[] {
  return fixtures.map((fixture) => {
    const homeResolved = resolveSimulatorTeam({
      fifaCode: fixture.homeFifaCode,
      nameEn: fixture.homeName,
    });
    const awayResolved = resolveSimulatorTeam({
      fifaCode: fixture.awayFifaCode,
      nameEn: fixture.awayName,
    });

    if (!homeResolved || !awayResolved) {
      return {
        fixtureId: fixture.fixtureId,
        available: false,
        homeWin: 0,
        draw: 0,
        awayWin: 0,
        favoredTeamId: "",
        favoredSide: "home",
        favoredWinProbability: 0,
        isKnockout: isKnockoutMatch(fixture.matchType),
      };
    }

    const home = getAdjustedTeam(homeResolved.id, adjustments) ?? homeResolved;
    const away = getAdjustedTeam(awayResolved.id, adjustments) ?? awayResolved;
    const knockout = isKnockoutMatch(fixture.matchType);
    const probs = computeMatchOutcomeProbabilities(home, away, knockout);

    const base: FixturePredictionResult = {
      fixtureId: fixture.fixtureId,
      available: true,
      homeTeamId: home.id,
      awayTeamId: away.id,
      homeTeamName: home.name,
      awayTeamName: away.name,
      homeWin: probs.homeWin,
      draw: probs.draw,
      awayWin: probs.awayWin,
      favoredTeamId: probs.favoredTeamId,
      favoredSide: probs.favoredSide,
      favoredWinProbability: probs.favoredWinProbability,
      favoredTeamName: favoredTeamName(probs, home.name, away.name),
      isKnockout: knockout,
    };

    if (
      fixture.isFinished &&
      fixture.homeGoals != null &&
      fixture.awayGoals != null
    ) {
      const accuracy = assessPredictionAccuracy(
        probs,
        fixture.homeGoals,
        fixture.awayGoals,
      );
      return {
        ...base,
        actualOutcome: accuracy.actualOutcome,
        predictionCorrect: accuracy.predictionCorrect,
        isUpset: accuracy.isUpset,
      };
    }

    return base;
  });
}
