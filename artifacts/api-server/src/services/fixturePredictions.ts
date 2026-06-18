import {
  assessTeamPickResult,
  computeMatchOutcomeProbabilities,
  getAdjustedTeam,
  getTeamPick,
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
  /** Team pick shown on schedule (higher win prob; never draw). */
  pickSide: "home" | "away";
  pickWinProbability: number;
  pickTeamId: string;
  pickTeamName: string;
  actualOutcome?: "home" | "away" | "draw";
  pickCorrect?: boolean;
  resultTone?: "hit" | "draw" | "miss";
  /** @deprecated use pickCorrect / resultTone */
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
        pickSide: "home",
        pickWinProbability: 0,
        pickTeamId: "",
        pickTeamName: "",
        isKnockout: isKnockoutMatch(fixture.matchType),
      };
    }

    const home = getAdjustedTeam(homeResolved.id, adjustments) ?? homeResolved;
    const away = getAdjustedTeam(awayResolved.id, adjustments) ?? awayResolved;
    const knockout = isKnockoutMatch(fixture.matchType);
    const probs = computeMatchOutcomeProbabilities(home, away, knockout);
    const pick = getTeamPick(probs, home, away);

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
      pickSide: pick.pickSide,
      pickWinProbability: pick.pickWinProbability,
      pickTeamId: pick.pickTeamId,
      pickTeamName: pick.pickTeamName,
    };

    if (
      fixture.isFinished &&
      fixture.homeGoals != null &&
      fixture.awayGoals != null
    ) {
      const result = assessTeamPickResult(
        pick.pickSide,
        fixture.homeGoals,
        fixture.awayGoals,
      );
      return {
        ...base,
        actualOutcome: result.actualOutcome,
        pickCorrect: result.pickCorrect,
        resultTone: result.resultTone,
        predictionCorrect: result.pickCorrect,
        isUpset: result.resultTone === "miss",
      };
    }

    return base;
  });
}
