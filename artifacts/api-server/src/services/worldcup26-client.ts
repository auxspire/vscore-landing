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

  const res = await fetch(`${WORLD_CUP26_CONFIG.baseUrl}${path}`, { headers });
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

export function parseLocalDate(localDate: string): string | null {
  const m = localDate.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!m) return null;
  const month = +m[1];
  const day = +m[2];
  const year = +m[3];
  const hour = +m[4];
  const minute = +m[5];
  // worldcup26 local_date is venue wall-clock (US host cities, Eastern default)
  return wallTimeInZoneToUtcIso(year, month, day, hour, minute, "America/New_York");
}

/** Convert wall-clock in IANA zone to UTC ISO (Node / sync). */
function wallTimeInZoneToUtcIso(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): string | null {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  let guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(dtf.formatToParts(new Date(guess)).map((p) => [p.type, p.value]));
    const asUtc = Date.UTC(
      +parts.year,
      +parts.month - 1,
      +parts.day,
      +parts.hour,
      +parts.minute,
      +(parts.second ?? 0),
    );
    guess += guess - asUtc;
  }

  const d = new Date(guess);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function parseScorers(raw: string | null): unknown[] {
  if (!raw || raw === "null" || raw.trim() === "") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [{ raw }];
  } catch {
    return [{ raw }];
  }
}

export function isFinished(finished: string): boolean {
  return finished.toUpperCase() === "TRUE";
}
