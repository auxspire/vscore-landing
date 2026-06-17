import { parseLocalDate, type WorldCup26Game } from "./worldcup26-client";

/** Match length + stoppage/extra-time buffer before inferring FT from kickoff alone. */
const MATCH_END_BUFFER_MS = (2 * 60 + 45) * 60 * 1000;

export function isFinishedFlag(finished: string | null | undefined): boolean {
  const v = (finished ?? "").trim().toUpperCase();
  return v === "TRUE" || v === "1" || v === "YES" || v === "FINISHED" || v === "FT";
}

export function isElapsedFinished(timeElapsed: string | null | undefined): boolean {
  const t = (timeElapsed ?? "").trim().toLowerCase();
  if (!t || t === "null" || t === "notstarted") return false;
  if (t === "finished" || t === "ft" || t.includes("full time")) return true;
  return false;
}

function parseScore(raw: string | null | undefined): number | null {
  if (raw == null || raw.trim() === "" || raw.trim().toLowerCase() === "null") return null;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
}

function kickoffMs(game: WorldCup26Game): number | null {
  const iso = parseLocalDate(game.local_date, game.stadium_id);
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

/** worldcup26 often lags updating `finished` — infer FT from elapsed time and kickoff. */
export function resolveGameFinished(game: WorldCup26Game, nowMs = Date.now()): boolean {
  if (isFinishedFlag(game.finished)) return true;
  if (isElapsedFinished(game.time_elapsed)) return true;

  const started = kickoffMs(game);
  if (started == null) return false;

  const elapsed = (game.time_elapsed ?? "").trim().toLowerCase();
  const pastWindow = nowMs - started >= MATCH_END_BUFFER_MS;
  const hasScores =
    parseScore(game.home_score) != null && parseScore(game.away_score) != null;
  const inPlay = elapsed && elapsed !== "notstarted" && elapsed !== "null";

  if (pastWindow && (inPlay || hasScores)) return true;
  return false;
}

export interface FixtureLike {
  kickoff_at: string | null;
  time_elapsed: string | null;
  is_finished: boolean;
  home_goals: number | null;
  away_goals: number | null;
}

/** Client-side normalization for API/Supabase rows. */
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
