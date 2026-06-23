/** Helpers for post-match turf payment split prompts. */

export interface MatchLike {
  id?: number | string;
  completedAt?: string;
  status?: string;
  paymentData?: unknown;
  isResultEntry?: boolean;
}

export function isMatchCompleted(match: MatchLike | null | undefined): boolean {
  if (!match) return false;
  if (match.completedAt) return true;
  const status = (match.status ?? "").toLowerCase();
  return (
    status.includes("full") ||
    status.includes("finished") ||
    status === "completed" ||
    status === "ft"
  );
}

export function shouldShowSplitTurfCostCta(
  match: MatchLike | null | undefined,
  options: { isOwner?: boolean; highlightAfterEnd?: boolean } = {},
): boolean {
  if (!match || !options.isOwner) return false;
  if (!isMatchCompleted(match)) return false;
  if (match.paymentData) return false;
  return true;
}

export function splitTurfCostCtaMessage(highlightAfterEnd: boolean): string {
  return highlightAfterEnd
    ? "Match done — split the turf rent among players?"
    : "Split turf rent for this match among players?";
}
