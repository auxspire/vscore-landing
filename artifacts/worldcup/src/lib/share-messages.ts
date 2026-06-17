import { WORLDCUP_BASE } from "@/lib/seo";

const STAGE_LABELS: Record<string, string> = {
  group_stage: "Group stage",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarterfinal: "Quarter-finals",
  semifinal: "Semi-finals",
  final: "Final",
};

export function formatStage(stage: string): string {
  return STAGE_LABELS[stage] ?? stage.replace(/_/g, " ");
}

function formatPct(probability: number): string {
  return `${(probability * 100).toFixed(1)}%`;
}

function formatTopStages(
  stages: { stage: string; probability: number }[],
  limit = 3,
): string | null {
  const top = [...stages]
    .filter((s) => s.probability > 0.001)
    .sort((a, b) => b.probability - a.probability)
    .slice(0, limit);

  if (top.length === 0) return null;
  return top.map((s) => `${formatStage(s.stage)} ${formatPct(s.probability)}`).join(" · ");
}

function simulationDetail(simulationsRun: number, useLiveMetrics?: boolean): string {
  const sims = simulationsRun.toLocaleString();
  if (useLiveMetrics) {
    return `${sims} Monte Carlo simulations · live standings & recent form blended into Elo`;
  }
  return `${sims} Monte Carlo simulations · full tournament Elo model`;
}

export interface SharePayload {
  /** Short headline for share title / first line */
  headline: string;
  /** Direct link to this prediction or bracket view */
  predictionUrl: string;
  /** Detail bullets — no URLs */
  details: string[];
  /** Generic VScor landing */
  siteUrl: string;
}

/** Clipboard / WhatsApp — prediction link first, site link last */
export function formatShareClipboard(payload: SharePayload): string {
  const lines = [
    payload.headline,
    "",
    `View prediction: ${payload.predictionUrl}`,
    "",
    ...payload.details,
    "",
    `More World Cup predictions → ${payload.siteUrl}`,
  ];
  return lines.join("\n");
}

export function buildMatchupShareMessage(params: {
  teamA: string;
  teamB: string;
  totalProbability: number;
  stages: { stage: string; probability: number }[];
  simulationsRun: number;
  sameGroup?: boolean;
  useLiveMetrics?: boolean;
  shareUrl: string;
}): SharePayload {
  const {
    teamA,
    teamB,
    totalProbability,
    stages,
    simulationsRun,
    sameGroup,
    useLiveMetrics,
    shareUrl,
  } = params;

  const pct = formatPct(totalProbability);
  const stageBreakdown = formatTopStages(stages, 4);

  const details = [
    `Overall meeting probability: ${pct}`,
    stageBreakdown ? `Most likely stages: ${stageBreakdown}` : null,
    sameGroup ? "Same group — guaranteed group-stage meeting" : null,
    simulationDetail(simulationsRun, useLiveMetrics),
  ].filter((line): line is string => line != null);

  return {
    headline: `${teamA} vs ${teamB} — ${pct} meeting chance | VScor`,
    predictionUrl: shareUrl,
    details,
    siteUrl: WORLDCUP_BASE,
  };
}

export function buildBracketShareMessage(params: {
  teamName: string;
  winProbability: number;
  simulationsRun: number;
  path?: { stage: string; reachProbability: number }[];
  lockedStage?: string | null;
  lockedOpponentName?: string | null;
  useLiveMetrics?: boolean;
  shareUrl: string;
}): SharePayload {
  const {
    teamName,
    winProbability,
    simulationsRun,
    path,
    lockedStage,
    lockedOpponentName,
    useLiveMetrics,
    shareUrl,
  } = params;

  const pct = formatPct(winProbability);
  const isLocked = lockedStage && lockedOpponentName;

  const pathHighlights =
    path && path.length > 0
      ? formatTopStages(
          path.map((s) => ({ stage: s.stage, probability: s.reachProbability })),
          3,
        )
      : null;

  const details = [
    isLocked
      ? `Win probability (locked path vs ${lockedOpponentName}): ${pct}`
      : `Tournament win probability: ${pct}`,
    pathHighlights ? `Reach odds: ${pathHighlights}` : null,
    !isLocked ? "Full bracket simulation across all knockout paths" : null,
    simulationDetail(simulationsRun, useLiveMetrics),
  ].filter((line): line is string => line != null);

  return {
    headline: isLocked
      ? `${teamName} vs ${lockedOpponentName} — ${pct} win chance | VScor`
      : `${teamName} — ${pct} to win World Cup 2026 | VScor`,
    predictionUrl: shareUrl,
    details,
    siteUrl: WORLDCUP_BASE,
  };
}
