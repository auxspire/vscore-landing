import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { isTodayInTimezone } from "@/lib/match-datetime";

export interface FootballFixture {
  api_fixture_id: string;
  kickoff_at: string | null;
  home_team_id: string | null;
  home_team_name: string | null;
  away_team_id: string | null;
  away_team_name: string | null;
  home_goals: number | null;
  away_goals: number | null;
  home_scorers: unknown[] | null;
  away_scorers: unknown[] | null;
  group_name: string | null;
  match_type: string | null;
  time_elapsed: string | null;
  is_finished: boolean;
}

export interface FootballStanding {
  group_name: string;
  rank: number | null;
  team_id: string;
  team_name: string | null;
  played: number | null;
  won: number | null;
  drawn: number | null;
  lost: number | null;
  goals_for: number | null;
  goals_against: number | null;
  goal_difference: number | null;
  points: number | null;
}

export interface FootballTeam {
  api_team_id: string;
  name_en: string;
  fifa_code: string | null;
  group_name: string | null;
  flag_url: string | null;
}

const STALE = 5 * 60 * 1000;
const SYNC_POLL = 60 * 1000;

function sbQuery<T>(
  key: string[],
  fetcher: () => Promise<T>,
  options?: { refetchInterval?: number },
) {
  return useQuery({
    queryKey: key,
    queryFn: fetcher,
    staleTime: STALE,
    retry: 1,
    refetchInterval: options?.refetchInterval,
  });
}

export interface FootballSyncJobState {
  job_name: string;
  status: string;
  last_synced_at: string | null;
  next_sync_at: string | null;
  error_message: string | null;
  calls_used_today: number | null;
}

export function useFootballSyncJobs() {
  return sbQuery<FootballSyncJobState[]>(
    ["football-sync-jobs"],
    async () => {
      const sb = getSupabaseBrowserClient();
      if (!sb) return [];
      const { data, error } = await sb
        .from("football_api_sync_state")
        .select("job_name, status, last_synced_at, next_sync_at, error_message, calls_used_today")
        .eq("competition_key", "worldcup")
        .order("job_name");
      if (error) throw error;
      return (data ?? []) as FootballSyncJobState[];
    },
    { refetchInterval: SYNC_POLL },
  );
}

/** Most recent sync across all jobs (legacy helper) */
export function useFootballSyncState() {
  const q = useFootballSyncJobs();
  const latest = q.data?.length
    ? [...q.data].sort((a, b) =>
        (b.last_synced_at ?? "").localeCompare(a.last_synced_at ?? ""),
      )[0]
    : null;
  return { ...q, data: latest ?? null };
}

export function useFootballFixtures() {
  return sbQuery(["football-fixtures"], async () => {
    const sb = getSupabaseBrowserClient();
    if (!sb) return [] as FootballFixture[];
    const { data, error } = await sb
      .from("football_fixtures")
      .select(
        "api_fixture_id, kickoff_at, home_team_id, home_team_name, away_team_id, away_team_name, home_goals, away_goals, home_scorers, away_scorers, group_name, match_type, time_elapsed, is_finished",
      )
      .eq("competition_key", "worldcup")
      .order("kickoff_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as FootballFixture[];
  });
}

export function useFootballStandings() {
  return sbQuery(["football-standings"], async () => {
    const sb = getSupabaseBrowserClient();
    if (!sb) return [] as FootballStanding[];
    const { data, error } = await sb
      .from("football_standings")
      .select("*")
      .eq("competition_key", "worldcup")
      .order("group_name")
      .order("rank");
    if (error) throw error;
    return (data ?? []) as FootballStanding[];
  });
}

export function useFootballTeams() {
  return sbQuery(["football-teams"], async () => {
    const sb = getSupabaseBrowserClient();
    if (!sb) return [] as FootballTeam[];
    const { data, error } = await sb
      .from("football_teams")
      .select("api_team_id, name_en, fifa_code, group_name, flag_url")
      .eq("competition_key", "worldcup")
      .order("name_en");
    if (error) throw error;
    return (data ?? []) as FootballTeam[];
  });
}

export function isToday(iso: string | null, timeZone?: string): boolean {
  return isTodayInTimezone(iso, timeZone);
}

export function isLive(timeElapsed: string | null): boolean {
  if (!timeElapsed) return false;
  const t = timeElapsed.toLowerCase();
  return t !== "notstarted" && t !== "finished" && t !== "null";
}

export interface ScorerEntry {
  name: string;
  goals: number;
  teamName?: string;
}

function scorerName(entry: unknown): string {
  if (typeof entry === "string") {
    const trimmed = entry.trim();
    if (!trimmed) return "Unknown";
    // e.g. "45' Lionel Messi" or raw JSON string
    const tick = trimmed.match(/^\d+'\s*(.+)$/);
    if (tick) return tick[1].trim();
    if (trimmed.startsWith("{")) {
      try {
        return scorerName(JSON.parse(trimmed));
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }
  if (entry && typeof entry === "object") {
    const o = entry as Record<string, unknown>;
    for (const key of ["name", "name_en", "player_name", "player_name_en", "scorer"]) {
      if (typeof o[key] === "string" && o[key]) return o[key] as string;
    }
    if (typeof o.raw === "string") return scorerName(o.raw);
  }
  return "Unknown";
}

function normalizeScorerList(raw: unknown[] | null): unknown[] {
  if (!raw?.length) return [];
  const flat: unknown[] = [];
  for (const item of raw) {
    if (typeof item === "string" && item.trim().startsWith("[")) {
      try {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed)) {
          flat.push(...parsed);
          continue;
        }
      } catch {
        /* keep as string */
      }
    }
    flat.push(item);
  }
  return flat;
}

export function aggregateTopScorers(fixtures: FootballFixture[], limit = 15): ScorerEntry[] {
  const counts = new Map<string, ScorerEntry>();
  for (const f of fixtures.filter((x) => x.is_finished)) {
    for (const side of [
      { scorers: f.home_scorers, team: f.home_team_name, teamId: f.home_team_id },
      { scorers: f.away_scorers, team: f.away_team_name, teamId: f.away_team_id },
    ]) {
      for (const raw of normalizeScorerList(side.scorers)) {
        const name = scorerName(raw);
        if (name === "Unknown") continue;
        const key = `${name.toLowerCase()}|${side.teamId ?? side.team ?? ""}`;
        const cur = counts.get(key) ?? {
          name,
          goals: 0,
          teamName: side.team ?? undefined,
        };
        cur.goals += 1;
        counts.set(key, cur);
      }
    }
  }
  return [...counts.values()].sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name)).slice(0, limit);
}
