/** Helpers for post-match turf payment split prompts. */

export interface MatchLike {
  id?: number | string;
  completedAt?: string;
  status?: string;
  paymentData?: {
    playerShares?: Array<{
      playerId?: number | string;
      playerName?: string;
      amount?: number;
      isPaid?: boolean;
    }>;
  };
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

export interface PlayerShareLookup {
  playerId?: number | string;
  playerName?: string;
}

/** Find this user's turf share from saved payment data. */
export function findPlayerPaymentShare(
  match: MatchLike | null | undefined,
  player: PlayerShareLookup | null | undefined,
): { amount: number; isPaid: boolean } | null {
  const shares = match?.paymentData?.playerShares;
  if (!shares?.length || !player) return null;

  const byId =
    player.playerId != null
      ? shares.find((s) => String(s.playerId) === String(player.playerId))
      : null;
  const byName =
    player.playerName != null
      ? shares.find(
          (s) =>
            s.playerName?.toLowerCase() === player.playerName?.toLowerCase(),
        )
      : null;

  const row = byId ?? byName;
  if (!row || row.amount == null) return null;

  return { amount: row.amount, isPaid: Boolean(row.isPaid) };
}

export function shouldShowPlayerOwesBanner(
  match: MatchLike | null | undefined,
  options: { isOwner: boolean; linkedPlayer: PlayerShareLookup | null },
): boolean {
  if (!match?.paymentData || options.isOwner) return false;
  if (!isMatchCompleted(match)) return false;
  return findPlayerPaymentShare(match, options.linkedPlayer) != null;
}
