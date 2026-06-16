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

const MATCH_PREDICTOR_CTA = `Try VScor's free World Cup Match Predictor to check your team's chances → ${WORLDCUP_BASE}`;

const BRACKET_PREDICTOR_CTA = `Explore every team's path to the final with VScor's free Bracket Predictor → ${WORLDCUP_BASE}`;

export interface SharePayload {
  title: string;
  /** Details + promo — URL is appended separately when copying */
  text: string;
  url: string;
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

  const pct = (totalProbability * 100).toFixed(1);
  const sims = simulationsRun.toLocaleString();
  const mostLikely = [...stages].sort((a, b) => b.probability - a.probability)[0];
  const liveNote = useLiveMetrics ? " · live metrics included" : "";

  const lines = [
    `${teamA} vs ${teamB} — VScor World Cup 2026 Match Predictor`,
    "",
    `Overall meeting probability: ${pct}%`,
    mostLikely
      ? `Most likely stage: ${formatStage(mostLikely.stage)} (${(mostLikely.probability * 100).toFixed(1)}%)`
      : null,
    sameGroup ? "Same group — guaranteed group stage meeting" : null,
    `Simulation: ${sims} Monte Carlo runs${liveNote}`,
    "",
    MATCH_PREDICTOR_CTA,
  ].filter((line): line is string => line != null);

  return {
    title: `${teamA} vs ${teamB} — ${pct}% meeting chance | VScor`,
    text: lines.join("\n"),
    url: shareUrl,
  };
}

export function buildBracketShareMessage(params: {
  teamName: string;
  winProbability: number;
  simulationsRun: number;
  lockedStage?: string | null;
  lockedOpponentName?: string | null;
  useLiveMetrics?: boolean;
  shareUrl: string;
}): SharePayload {
  const {
    teamName,
    winProbability,
    simulationsRun,
    lockedStage,
    lockedOpponentName,
    useLiveMetrics,
    shareUrl,
  } = params;

  const pct = (winProbability * 100).toFixed(1);
  const sims = simulationsRun.toLocaleString();
  const liveNote = useLiveMetrics ? " · live metrics included" : "";
  const isLocked = lockedStage && lockedOpponentName;

  const lines = [
    `${teamName} — VScor World Cup 2026 Path to Final`,
    "",
    isLocked
      ? `Win probability (locked path vs ${lockedOpponentName}): ${pct}%`
      : `Tournament win probability: ${pct}%`,
    !isLocked ? "Based on full bracket simulation across all paths" : null,
    `Simulation: ${sims} Monte Carlo runs${liveNote}`,
    "",
    BRACKET_PREDICTOR_CTA,
  ].filter((line): line is string => line != null);

  return {
    title: `${teamName} — ${pct}% to win World Cup 2026 | VScor`,
    text: lines.join("\n"),
    url: shareUrl,
  };
}

/** Full clipboard / WhatsApp message with link at the end */
export function formatShareClipboard(payload: SharePayload): string {
  return `${payload.text}\n\n${payload.url}`;
}
