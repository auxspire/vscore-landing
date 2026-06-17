import { WORLD_CUP26_CONFIG } from "@workspace/football-config";

export interface WorldCup26Game {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  home_scorers: string | null;
  away_scorers: string | null;
  group: string;
  matchday: string;
  local_date: string;
  stadium_id: string;
  finished: string;
  time_elapsed: string;
  type: string;
  home_team_name_en?: string;
  away_team_name_en?: string;
  home_team_label?: string;
  away_team_label?: string;
}

export interface WorldCup26Group {
  group?: string;
  name?: string;
  teams: WorldCup26GroupTeam[];
}

export interface WorldCup26GroupTeam {
  team_id: string;
  pts: string;
  gf: string;
  ga: string;
  mp?: string;
  w?: string;
  l?: string;
  d?: string;
}

export interface WorldCup26Team {
  id: string;
  name_en: string;
  name_fa?: string;
  fifa_code?: string;
  groups: string;
  flag?: string;
}

let cachedToken: string | undefined = WORLD_CUP26_CONFIG.jwtToken;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function authenticate(): Promise<string | null> {
  const { authEmail, authPassword, baseUrl, endpoints } = WORLD_CUP26_CONFIG;
  if (!authEmail || !authPassword) return null;
  const res = await fetch(`${baseUrl}${endpoints.authenticate}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: authEmail, password: authPassword }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { token?: string };
  if (data.token) {
    cachedToken = data.token;
    return data.token;
  }
  return null;
}

async function apiFetch<T>(path: string, retryAuth = true, attempt = 0): Promise<T> {
  const token = cachedToken ?? (await authenticate());
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${WORLD_CUP26_CONFIG.baseUrl}${path}`, {
      headers,
      cache: "no-store",
    });
  } catch (err) {
    if (attempt < 2) {
      await sleep(400 * 2 ** attempt);
      return apiFetch<T>(path, retryAuth, attempt + 1);
    }
    const message = err instanceof Error ? err.message : "fetch failed";
    throw new Error(`worldcup26 ${path}: ${message}`);
  }

  if (res.status === 401 && retryAuth && token) {
    const fresh = await authenticate();
    if (fresh) return apiFetch<T>(path, false, attempt);
  }

  if (res.status >= 500 && attempt < 2) {
    await sleep(500 * 2 ** attempt);
    return apiFetch<T>(path, retryAuth, attempt + 1);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`worldcup26 ${path}: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchGames(): Promise<WorldCup26Game[]> {
  const data = await apiFetch<{ games?: WorldCup26Game[] } | WorldCup26Game[]>(
    WORLD_CUP26_CONFIG.endpoints.games,
  );
  if (Array.isArray(data)) return data;
  return data.games ?? [];
}

export async function fetchGroups(): Promise<WorldCup26Group[]> {
  const data = await apiFetch<WorldCup26Group[] | { groups?: WorldCup26Group[] }>(
    WORLD_CUP26_CONFIG.endpoints.groups,
  );
  if (Array.isArray(data)) return data;
  return data.groups ?? [];
}

export async function fetchTeams(): Promise<WorldCup26Team[]> {
  const data = await apiFetch<WorldCup26Team[] | { teams?: WorldCup26Team[] }>(
    WORLD_CUP26_CONFIG.endpoints.teams,
  );
  if (Array.isArray(data)) return data;
  return data.teams ?? [];
}

/** Build team rows from fixture data when /get/teams is down. */
export function deriveTeamsFromGames(games: WorldCup26Game[]): WorldCup26Team[] {
  const byId = new Map<string, WorldCup26Team>();

  for (const g of games) {
    for (const side of [
      {
        id: g.home_team_id,
        name: g.home_team_name_en ?? g.home_team_label,
        group: g.group,
      },
      {
        id: g.away_team_id,
        name: g.away_team_name_en ?? g.away_team_label,
        group: g.group,
      },
    ]) {
      if (!side.id) continue;
      const name = (side.name ?? "").trim();
      if (!name) continue;
      const prev = byId.get(side.id);
      byId.set(side.id, {
        id: side.id,
        name_en: name,
        groups: side.group || prev?.groups || "",
        fifa_code: prev?.fifa_code,
        name_fa: prev?.name_fa,
        flag: prev?.flag,
      });
    }
  }

  return [...byId.values()];
}

export type TeamsFetchSource = "teams" | "games";

/** Retry /get/teams; fall back to names from /get/games when the teams endpoint errors. */
export async function fetchTeamsResilient(): Promise<{
  teams: WorldCup26Team[];
  source: TeamsFetchSource;
}> {
  const errors: string[] = [];

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const teams = await fetchTeams();
      if (teams.length > 0) return { teams, source: "teams" };
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
      if (attempt < 2) await sleep(600 * 2 ** attempt);
    }
  }

  try {
    const games = await fetchGames();
    const teams = deriveTeamsFromGames(games);
    if (teams.length > 0) {
      return { teams, source: "games" };
    }
    errors.push("No teams derivable from games");
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  throw new Error(errors.join(" | "));
}

/** IANA timezone per worldcup26 stadium id (venue local wall-clock for local_date). */
export const STADIUM_TIMEZONES: Record<string, string> = {
  "1": "America/Mexico_City",
  "2": "America/Mexico_City",
  "3": "America/Mexico_City",
  "4": "America/Chicago",
  "5": "America/Chicago",
  "6": "America/Chicago",
  "7": "America/New_York",
  "8": "America/New_York",
  "9": "America/New_York",
  "10": "America/New_York",
  "11": "America/New_York",
  "12": "America/Toronto",
  "13": "America/Vancouver",
  "14": "America/Los_Angeles",
  "15": "America/Los_Angeles",
  "16": "America/Los_Angeles",
};

const DEFAULT_VENUE_TIMEZONE = "America/Chicago";

export function stadiumTimezone(stadiumId?: string | null): string {
  if (!stadiumId) return DEFAULT_VENUE_TIMEZONE;
  return STADIUM_TIMEZONES[stadiumId] ?? DEFAULT_VENUE_TIMEZONE;
}

export function parseLocalDate(localDate: string, stadiumId?: string | null): string | null {
  const m = localDate.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!m) return null;
  const month = +m[1];
  const day = +m[2];
  const year = +m[3];
  const hour = +m[4];
  const minute = +m[5];
  return wallTimeInZoneToUtcIso(year, month, day, hour, minute, stadiumTimezone(stadiumId));
}

/** Convert venue wall-clock to UTC ISO. */
function wallTimeInZoneToUtcIso(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): string | null {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
  const probe = new Date(utcGuess);
  const inTz = new Date(probe.toLocaleString("en-US", { timeZone }));
  const inUtc = new Date(probe.toLocaleString("en-US", { timeZone: "UTC" }));
  const offsetMs = inUtc.getTime() - inTz.getTime();
  const d = new Date(utcGuess + offsetMs);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function normalizeScorerRaw(raw: string): string {
  return raw
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .trim();
}

/** Extract double-quoted segments from worldcup26 pseudo-JSON scorer blobs. */
function extractQuotedScorerSegments(inner: string): string[] {
  const results: string[] = [];
  const re = /"((?:\\.|[^"\\])*)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(inner)) !== null) {
    const value = match[1].replace(/\\"/g, '"').trim();
    if (value && value.toLowerCase() !== "null") results.push(value);
  }
  return results;
}

export function parseScorers(raw: string | null): unknown[] {
  if (!raw || raw === "null" || raw.trim() === "") return [];

  const normalized = normalizeScorerRaw(raw);

  try {
    const parsed = JSON.parse(normalized);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") return Object.values(parsed as Record<string, unknown>);
    if (typeof parsed === "string") return parseScorers(parsed);
    return [];
  } catch {
    const trimmed = normalized.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const quoted = extractQuotedScorerSegments(trimmed.slice(1, -1));
      if (quoted.length > 0) return quoted;
    }
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        /* fall through */
      }
    }
    if (/^\d+['′]/.test(trimmed) || /['′]\s*$/.test(trimmed)) return [trimmed];
    if (trimmed.length > 0 && trimmed.toLowerCase() !== "null") return [trimmed];
    return [];
  }
}

export function isFinished(finished: string): boolean {
  return finished.toUpperCase() === "TRUE";
}
