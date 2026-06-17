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

async function apiFetch<T>(path: string, retry = true): Promise<T> {
  const token = cachedToken ?? (await authenticate());
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${WORLD_CUP26_CONFIG.baseUrl}${path}`, {
    headers,
    cache: "no-store",
  });
  if (res.status === 401 && retry && token) {
    const fresh = await authenticate();
    if (fresh) return apiFetch<T>(path, false);
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
