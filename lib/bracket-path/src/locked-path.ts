import {
  canTeamFaceGroupAtStage,
  knockoutStageIndex,
  topFinishKey,
  type GroupFinish,
  type KnockoutStage,
} from "./topology";
import type { ConditionalPathOpponent, ConditionalPathStage } from "./conditional-path";

export interface PathOpponent {
  team: { id: string; name: string; group: string; flagCode?: string };
  encounterProbability: number;
  winProbabilityIfFacing: number;
  groupFinish?: Record<string, number>;
  sampleCount?: number;
  conditionalPath?: ConditionalPathStage[];
}

export interface PathStage {
  stage: string;
  description?: string;
  reachProbability: number;
  teamGroupFinish?: Record<string, number>;
  topOpponents: PathOpponent[];
  opponentsByFinish?: Record<string, PathOpponent[]>;
  isConditional?: boolean;
  sampleCount?: number;
}

export interface LockedPathInput {
  path: PathStage[];
  teamGroup: string;
  lockedStage: string;
  lockedOpponentId: string;
  lockedFinishPos?: string | null;
}

export interface LockedPathResult {
  stages: PathStage[];
  lockOpponent: PathOpponent | undefined;
  teamFinishScenario: GroupFinish | null;
  winProbability: number;
}

/** Pick the finish-section row that best matches this opponent (avoids wrong conditional path). */
export function resolveLockedOpponent(
  lockStageNode: PathStage | undefined,
  lockedOpponentId: string,
  lockedFinishPos?: string | null,
): PathOpponent | undefined {
  if (!lockStageNode) return undefined;

  if (lockedFinishPos && lockStageNode.opponentsByFinish?.[lockedFinishPos]) {
    const fromSection = lockStageNode.opponentsByFinish[lockedFinishPos].find(
      (o) => o.team.id === lockedOpponentId,
    );
    if (fromSection) return fromSection;
  }

  if (lockStageNode.opponentsByFinish) {
    let best: PathOpponent | undefined;
    for (const opps of Object.values(lockStageNode.opponentsByFinish)) {
      const found = opps.find((o) => o.team.id === lockedOpponentId);
      if (found && (!best || found.encounterProbability > best.encounterProbability)) {
        best = found;
      }
    }
    if (best) return best;
  }

  return lockStageNode.topOpponents.find((o) => o.team.id === lockedOpponentId);
}

/** Infer group finish for lock when user did not click a specific R32 section. */
export function inferFinishPosForOpponent(
  lockStageNode: PathStage | undefined,
  lockedOpponentId: string,
): GroupFinish | null {
  if (!lockStageNode) return null;

  if (lockStageNode.opponentsByFinish) {
    let bestPos: GroupFinish | null = null;
    let bestEnc = -1;
    for (const [pos, opps] of Object.entries(lockStageNode.opponentsByFinish)) {
      const found = opps.find((o) => o.team.id === lockedOpponentId);
      if (found && found.encounterProbability > bestEnc) {
        bestEnc = found.encounterProbability;
        if (pos === "1st" || pos === "2nd" || pos === "3rd") bestPos = pos;
      }
    }
    if (bestPos) return bestPos;
  }

  return topFinishKey(lockStageNode.teamGroupFinish ?? {});
}

function filterEligibleOpponents(
  opps: PathOpponent[],
  eliminated: Set<string>,
  teamGroup: string,
  teamFinish: GroupFinish | null,
  stage: KnockoutStage,
): PathOpponent[] {
  return opps.filter((o) => {
    if (eliminated.has(o.team.id)) return false;
    if (!teamFinish) return true;
    return canTeamFaceGroupAtStage(teamGroup, teamFinish, o.team.group, stage);
  });
}

/**
 * Enforce a single coherent knockout path: no team appears twice after the lock,
 * and each foe must be bracket-valid for the team's finish scenario.
 */
export function applyPathChainFilter(
  stages: PathStage[],
  lockIdx: number,
  lockedOpponentId: string,
  teamGroup: string,
  teamFinish: GroupFinish | null,
): PathStage[] {
  const eliminatedOnPath = new Set<string>([lockedOpponentId]);

  return stages.map((stage) => {
    const stageIdx = knockoutStageIndex(stage.stage);
    if (stageIdx <= lockIdx) return stage;

    const eligible = filterEligibleOpponents(
      stage.topOpponents,
      eliminatedOnPath,
      teamGroup,
      teamFinish,
      stage.stage as KnockoutStage,
    );

    const topOpponents = eligible;
    if (topOpponents[0]) eliminatedOnPath.add(topOpponents[0].team.id);

    return { ...stage, topOpponents };
  });
}

/** Win probability assuming our team beats the primary foe at every stage on the path. */
export function computeChainedWinProbability(
  stages: PathStage[],
  lockIdx: number,
  lockWinProbability: number,
): number {
  let prob = lockWinProbability;

  for (const stage of stages) {
    const stageIdx = knockoutStageIndex(stage.stage);
    if (stageIdx <= lockIdx) continue;

    const primary = stage.topOpponents[0];
    if (!primary) break;
    prob *= primary.winProbabilityIfFacing;
  }

  return Math.min(1, Math.max(0, prob));
}

/**
 * Build the full display path after a user locks an opponent.
 * Single source of truth for PathStrip, stage cards, win %, and share text.
 */
export function buildLockedDisplayPath(input: LockedPathInput): LockedPathResult {
  const { path, teamGroup, lockedStage, lockedOpponentId, lockedFinishPos } = input;
  const lockIdx = knockoutStageIndex(lockedStage);
  if (lockIdx < 0) {
    return {
      stages: path,
      lockOpponent: undefined,
      teamFinishScenario: null,
      winProbability: 0,
    };
  }

  const lockStageNode = path.find((s) => s.stage === lockedStage);
  const lockOpponent = resolveLockedOpponent(lockStageNode, lockedOpponentId, lockedFinishPos);
  const teamFinishScenario =
    (lockedFinishPos as GroupFinish | null) ??
    inferFinishPosForOpponent(lockStageNode, lockedOpponentId);

  const mapped = path.map((stage) => {
    const stageIdx = knockoutStageIndex(stage.stage);
    if (stageIdx < lockIdx) return stage;

    if (stageIdx === lockIdx) {
      const locked = lockOpponent ?? stage.topOpponents.find((o) => o.team.id === lockedOpponentId);
      const others = stage.topOpponents.filter((o) => o.team.id !== lockedOpponentId);
      return {
        ...stage,
        topOpponents: locked ? [locked, ...others] : stage.topOpponents,
      };
    }

    const cpEntry = lockOpponent?.conditionalPath?.find((cp) => cp.stage === stage.stage);
    if (cpEntry) {
      return {
        ...stage,
        reachProbability: cpEntry.reachProbability,
        topOpponents: cpEntry.topOpponents as PathOpponent[],
        isConditional: true,
        sampleCount: cpEntry.sampleCount,
      };
    }

    return { ...stage, isConditional: true, topOpponents: [] };
  });

  const stages = applyPathChainFilter(
    mapped,
    lockIdx,
    lockedOpponentId,
    teamGroup,
    teamFinishScenario,
  );

  const lockWin = lockOpponent?.winProbabilityIfFacing ?? 0;
  const winProbability = computeChainedWinProbability(stages, lockIdx, lockWin);

  return { stages, lockOpponent, teamFinishScenario, winProbability };
}

/** Verify no opponent appears twice on the locked path strip (primary foe per stage). */
export function assertNoDuplicatePathOpponents(
  stages: PathStage[],
  lockIdx: number,
  lockedOpponentId: string,
): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const stage of stages) {
    const stageIdx = knockoutStageIndex(stage.stage);
    if (stageIdx < lockIdx) continue;

    const primary =
      stageIdx === lockIdx
        ? (stage.topOpponents.find((o) => o.team.id === lockedOpponentId) ?? stage.topOpponents[0])
        : stage.topOpponents[0];

    if (!primary) continue;

    if (seen.has(primary.team.id)) {
      errors.push(`${primary.team.name} appears again at ${stage.stage}`);
    }
    seen.add(primary.team.id);
  }

  return errors;
}
