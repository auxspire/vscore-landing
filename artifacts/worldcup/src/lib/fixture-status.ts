/** Mirror of api-server match-status for client-side normalization of cached rows. */

const MATCH_END_BUFFER_MS = (2 * 60 + 45) * 60 * 1000;

function isElapsedFinished(timeElapsed: string | null | undefined): boolean {
  const t = (timeElapsed ?? "").trim().toLowerCase();
  if (!t || t === "null" || t === "notstarted") return false;
  if (t === "finished" || t === "ft" || t.includes("full time")) return true;
  return false;
}

export interface FixtureLike {
  kickoff_at: string | null;
  time_elapsed: string | null;
  is_finished: boolean;
  home_goals: number | null;
  away_goals: number | null;
}

export function resolveFixtureFinished(f: FixtureLike, nowMs = Date.now()): boolean {
  if (f.is_finished) return true;
  if (isElapsedFinished(f.time_elapsed)) return true;

  if (!f.kickoff_at) return false;
  const started = Date.parse(f.kickoff_at);
  if (Number.isNaN(started)) return false;

  const elapsed = (f.time_elapsed ?? "").trim().toLowerCase();
  const pastWindow = nowMs - started >= MATCH_END_BUFFER_MS;
  const hasScores = f.home_goals != null && f.away_goals != null;
  const inPlay = elapsed && elapsed !== "notstarted" && elapsed !== "null";

  if (pastWindow && (inPlay || hasScores)) return true;
  return false;
}

export function normalizeFixtureRow<T extends FixtureLike>(f: T, nowMs = Date.now()): T {
  const finished = resolveFixtureFinished(f, nowMs);
  if (finished === f.is_finished) return f;
  return { ...f, is_finished: finished };
}

export function normalizeFixtures<T extends FixtureLike>(fixtures: T[], nowMs = Date.now()): T[] {
  return fixtures.map((f) => normalizeFixtureRow(f, nowMs));
}
