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
  /** Opponents shown from aggregate sims when conditional/path-filter data was empty */
  opponentsFromAggregate?: boolean;
  /** Auto R32-anchor projection vs explicit user lock */
  pathProjection?: "projected" | "user_locked";
}

export interface LockedPathInput {
  path: PathStage[];
  teamGroup: string;
  lockedStage: string;
  lockedOpponentId: string;
  lockedFinishPos?: string | null;
  /** When true, mark post-lock conditional stages as projected (most-likely view) */
  asProjectedPath?: boolean;
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

function dedupeOpponents(opps: PathOpponent[]): PathOpponent[] {
  const seen = new Set<string>();
  return opps.filter((o) => {
    if (seen.has(o.team.id)) return false;
    seen.add(o.team.id);
    return true;
  });
}

function sortOpponentsByEncounter(opps: PathOpponent[]): PathOpponent[] {
  return [...opps].sort((a, b) => b.encounterProbability - a.encounterProbability);
}

/**
 * Pick ordered opponents for one knockout stage on a sequential path.
 * Skips eliminated foes (e.g. Scotland already beaten at R32) and walks down the list.
 */
function pickStageOpponents(
  pools: PathOpponent[][],
  eliminated: Set<string>,
  teamGroup: string,
  teamFinish: GroupFinish | null,
  stage: KnockoutStage,
): { topOpponents: PathOpponent[]; opponentsFromAggregate: boolean } {
  const merged = sortOpponentsByEncounter(dedupeOpponents(pools.flat()));

  const strict: PathOpponent[] = [];
  const relaxed: PathOpponent[] = [];

  for (const o of merged) {
    if (eliminated.has(o.team.id)) continue;
    relaxed.push(o);
    if (!teamFinish || canTeamFaceGroupAtStage(teamGroup, teamFinish, o.team.group, stage)) {
      strict.push(o);
    }
  }

  const pick = strict.length > 0 ? strict : relaxed;
  if (pick.length === 0) {
    return { topOpponents: [], opponentsFromAggregate: false };
  }

  return {
    topOpponents: pick,
    opponentsFromAggregate: strict.length === 0 && relaxed.length > 0,
  };
}

function clearUnreachableStage(stage: PathStage): PathStage {
  return {
    ...stage,
    topOpponents: [],
    reachProbability: 0,
    isConditional: false,
    opponentsFromAggregate: undefined,
    pathProjection: undefined,
  };
}

/** Enforce a single continuous path: no stage after a gap, reach non-increasing. */
export function finalizeSequentialPath(stages: PathStage[]): PathStage[] {
  let pathActive = true;
  let prevReach = 1;
  const result: PathStage[] = [];

  for (const stage of stages) {
    if (!pathActive) {
      result.push(clearUnreachableStage(stage));
      continue;
    }

    if (stage.topOpponents.length === 0) {
      pathActive = false;
      result.push(clearUnreachableStage(stage));
      continue;
    }

    const reachProbability = Math.min(stage.reachProbability, prevReach);
    prevReach = reachProbability;
    result.push({ ...stage, reachProbability });
  }

  return result;
}

/** Teams already beaten on the path before the lock stage. */
function seedEliminatedBeforeLock(
  stages: PathStage[],
  lockIdx: number,
  lockedOpponentId: string,
): Set<string> {
  const eliminated = new Set<string>([lockedOpponentId]);

  for (const stage of stages) {
    const stageIdx = knockoutStageIndex(stage.stage);
    if (stageIdx >= lockIdx) continue;

    const primary = stage.topOpponents[0];
    if (primary) eliminated.add(primary.team.id);
  }

  return eliminated;
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
  originalPath?: PathStage[],
): PathStage[] {
  const eliminatedOnPath = seedEliminatedBeforeLock(stages, lockIdx, lockedOpponentId);
  const originalsByStage = new Map(originalPath?.map((s) => [s.stage, s]));

  const mapped = stages.map((stage) => {
    const stageIdx = knockoutStageIndex(stage.stage);
    if (stageIdx <= lockIdx) return stage;

    const original = originalsByStage.get(stage.stage);
    const pools: PathOpponent[][] = [stage.topOpponents];
    if (original?.topOpponents?.length) {
      pools.push(original.topOpponents);
    }

    const { topOpponents, opponentsFromAggregate } = pickStageOpponents(
      pools,
      eliminatedOnPath,
      teamGroup,
      teamFinish,
      stage.stage as KnockoutStage,
    );

    if (topOpponents[0]) eliminatedOnPath.add(topOpponents[0].team.id);

    let reachProbability = stage.reachProbability;
    let isConditional = stage.isConditional;

    if (topOpponents.length === 0) {
      reachProbability = 0;
    } else if (opponentsFromAggregate && original) {
      reachProbability = original.reachProbability;
      isConditional = false;
    }

    return {
      ...stage,
      topOpponents,
      reachProbability,
      isConditional,
      opponentsFromAggregate: opponentsFromAggregate || undefined,
    };
  });

  return finalizeSequentialPath(mapped);
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

function resolveR32Anchor(
  r32: PathStage,
  teamGroup: string,
): { anchor: PathOpponent; finishPos: GroupFinish | null } | null {
  const teamFinish = topFinishKey(r32.teamGroupFinish ?? {});
  const pools: PathOpponent[][] = [];
  if (r32.opponentsByFinish && teamFinish) {
    const scenarioList = r32.opponentsByFinish[teamFinish];
    if (scenarioList?.length) pools.push(scenarioList);
  }
  pools.push(r32.topOpponents);

  const pick = pickStageOpponents(
    pools,
    new Set(),
    teamGroup,
    teamFinish,
    "round_of_32",
  );
  const anchor = pick.topOpponents[0];
  if (!anchor) return null;

  let finishPos: GroupFinish | null = teamFinish;
  if (r32.opponentsByFinish) {
    for (const [pos, opps] of Object.entries(r32.opponentsByFinish)) {
      if (
        opps.some((o) => o.team.id === anchor.team.id) &&
        (pos === "1st" || pos === "2nd" || pos === "3rd")
      ) {
        finishPos = pos as GroupFinish;
        break;
      }
    }
  }

  return { anchor, finishPos };
}

/**
 * Build the full display path after a user locks an opponent.
 * Single source of truth for PathStrip, stage cards, win %, and share text.
 */
export function buildLockedDisplayPath(input: LockedPathInput): LockedPathResult {
  const { path, teamGroup, lockedStage, lockedOpponentId, lockedFinishPos, asProjectedPath } =
    input;
  const lockIdx = knockoutStageIndex(lockedStage);
  if (lockIdx < 0) {
    const stages = finalizeSequentialPath(buildAggregateDisplayPath(path, teamGroup));
    return {
      stages,
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

  const projection: PathStage["pathProjection"] = asProjectedPath ? "projected" : "user_locked";

  const mapped = path.map((stage) => {
    const stageIdx = knockoutStageIndex(stage.stage);
    if (stageIdx < lockIdx) return stage;

    if (stageIdx === lockIdx) {
      const locked =
        lockOpponent ?? stage.topOpponents.find((o) => o.team.id === lockedOpponentId);
      const others = stage.topOpponents.filter((o) => o.team.id !== lockedOpponentId);
      return {
        ...stage,
        topOpponents: locked ? [locked, ...others] : stage.topOpponents,
        pathProjection: stageIdx === lockIdx && asProjectedPath ? undefined : projection,
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
        pathProjection: projection,
      };
    }

    return { ...stage, isConditional: true, pathProjection: projection };
  });

  const stages = applyPathChainFilter(
    mapped,
    lockIdx,
    lockedOpponentId,
    teamGroup,
    teamFinishScenario,
    path,
  );

  const lockWin = lockOpponent?.winProbabilityIfFacing ?? 0;
  const winProbability = computeChainedWinProbability(stages, lockIdx, lockWin);

  return { stages, lockOpponent, teamFinishScenario, winProbability };
}

/**
 * Build a coherent "most likely path" for the unlocked view.
 * Picks one primary foe per stage and removes teams already beaten earlier.
 */
function buildAggregateDisplayPath(path: PathStage[], teamGroup: string): PathStage[] {
  const r32 = path.find((s) => s.stage === "round_of_32");
  const teamFinish = topFinishKey(r32?.teamGroupFinish ?? {});
  const eliminatedOnPath = new Set<string>();

  const built = path.map((stage) => {
    const pools: PathOpponent[][] = [stage.topOpponents];
    if (stage.stage === "round_of_32" && stage.opponentsByFinish && teamFinish) {
      const scenarioList = stage.opponentsByFinish[teamFinish];
      if (scenarioList?.length) pools.unshift(scenarioList);
    }

    const { topOpponents, opponentsFromAggregate } = pickStageOpponents(
      pools,
      eliminatedOnPath,
      teamGroup,
      teamFinish,
      stage.stage as KnockoutStage,
    );

    if (topOpponents[0]) eliminatedOnPath.add(topOpponents[0].team.id);

    let reachProbability = stage.reachProbability;
    let isConditional = stage.isConditional;

    if (topOpponents.length === 0) {
      reachProbability = 0;
    } else if (opponentsFromAggregate) {
      isConditional = false;
    }

    return {
      ...stage,
      topOpponents,
      reachProbability,
      isConditional,
      opponentsFromAggregate: opponentsFromAggregate || undefined,
    };
  });

  return finalizeSequentialPath(built);
}

export function buildMostLikelyDisplayPath(path: PathStage[], teamGroup: string): PathStage[] {
  const r32 = path.find((s) => s.stage === "round_of_32");
  if (!r32) return finalizeSequentialPath(path);

  const anchorResult = resolveR32Anchor(r32, teamGroup);
  if (!anchorResult) {
    return buildAggregateDisplayPath(path, teamGroup);
  }

  const { anchor, finishPos } = anchorResult;

  const locked = buildLockedDisplayPath({
    path,
    teamGroup,
    lockedStage: "round_of_32",
    lockedOpponentId: anchor.team.id,
    lockedFinishPos: finishPos,
    asProjectedPath: true,
  });

  const hasLaterOpponents = locked.stages.some(
    (s) =>
      knockoutStageIndex(s.stage) > knockoutStageIndex("round_of_32") &&
      s.topOpponents.length > 0,
  );

  if (!hasLaterOpponents) {
    return buildAggregateDisplayPath(path, teamGroup);
  }

  return locked.stages;
}

/** Verify no opponent appears twice on the path strip (primary foe per stage). */
export function assertNoDuplicatePathOpponents(
  stages: PathStage[],
  lockIdx = 0,
  lockedOpponentId?: string,
): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const stage of stages) {
    const stageIdx = knockoutStageIndex(stage.stage);
    if (stageIdx < lockIdx) continue;

    const primary =
      lockIdx >= 0 && stageIdx === lockIdx && lockedOpponentId
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
