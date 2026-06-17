import {
  canTeamFaceGroupAtStage,
  KNOCKOUT_STAGES,
  type GroupFinish,
  type KnockoutStage,
} from "./topology";

export interface PathTeam {
  id: string;
  group: string;
}

export interface ConditionalPathOpponent {
  team: PathTeam;
  encounterProbability: number;
  winProbabilityIfFacing: number;
}

export interface ConditionalPathStage {
  stage: string;
  reachProbability: number;
  sampleCount?: number;
  topOpponents: ConditionalPathOpponent[];
}

export interface ConditionalPathScenario {
  teamGroup: string;
  teamFinish: GroupFinish;
}

/** Raw conditional stage from simulation (counts not yet normalised). */
export interface RawConditionalStage {
  reachCount: number;
  opponents: Record<
    string,
    { team: PathTeam; encounterCount: number; winsIfFacing: number }
  >;
}

export function buildConditionalPathResponse(
  fromStage: string,
  winsDenominator: number,
  conditionalSource: Record<string, RawConditionalStage>,
  scenario?: ConditionalPathScenario,
): ConditionalPathStage[] {
  const eliminatedOnPath = new Set<string>();
  const fromIdx = KNOCKOUT_STAGES.indexOf(fromStage as KnockoutStage);
  if (fromIdx < 0) return [];

  const results: ConditionalPathStage[] = [];

  for (const nextStage of KNOCKOUT_STAGES) {
    if (KNOCKOUT_STAGES.indexOf(nextStage) <= fromIdx) continue;

    const cp = conditionalSource[nextStage];
    if (!cp || cp.reachCount === 0) continue;

    const cpOpponents = Object.values(cp.opponents)
      .filter((co) => {
        if (eliminatedOnPath.has(co.team.id)) return false;
        if (!scenario) return true;
        return canTeamFaceGroupAtStage(
          scenario.teamGroup,
          scenario.teamFinish,
          co.team.group,
          nextStage,
        );
      })
      .sort((a, b) => b.encounterCount - a.encounterCount)
      .slice(0, 5)
      .map((co) => ({
        team: co.team,
        encounterProbability: cp.reachCount > 0 ? co.encounterCount / cp.reachCount : 0,
        winProbabilityIfFacing: co.encounterCount > 0 ? co.winsIfFacing / co.encounterCount : 0,
      }));

    if (cpOpponents.length === 0) continue;

    if (cpOpponents[0]?.team?.id) {
      eliminatedOnPath.add(cpOpponents[0].team.id);
    }

    results.push({
      stage: nextStage,
      reachProbability: winsDenominator > 0 ? Math.min(1, cp.reachCount / winsDenominator) : 0,
      sampleCount: cp.reachCount,
      topOpponents: cpOpponents,
    });
  }

  return results;
}
