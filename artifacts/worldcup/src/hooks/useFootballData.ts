import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { isTodayInTimezone, isTodayOrTomorrowInTimezone } from "@/lib/match-datetime";
import { normalizeFixtures } from "@/lib/fixture-status";
import { aggregateTopScorers, type ScorerEntry } from "@/lib/scorer-utils";

export type { ScorerEntry };
export { aggregateTopScorers };

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

const STALE = 60 * 1000;
const SYNC_POLL = 60 * 1000;
const LIVE_STALE = 60 * 1000;
const LIVE_REFETCH = 2 * 60 * 1000;

export interface FootballLiveData {
  fixtures: FootballFixture[];
  standings: FootballStanding[];
  teams: FootballTeam[];
  fetchedAt: string | null;
  source: "api" | "supabase";
  apiError?: string | null;
}

const FIXTURE_COLUMNS =
  "api_fixture_id, kickoff_at, home_team_id, home_team_name, away_team_id, away_team_name, home_goals, away_goals, home_scorers, away_scorers, group_name, match_type, time_elapsed, is_finished";

async function fetchLiveFromSupabase(): Promise<FootballLiveData> {
  const sb = getSupabaseBrowserClient();
  if (!sb) {
    return { fixtures: [], standings: [], teams: [], fetchedAt: null, source: "supabase" };
  }

  const [fixturesRes, standingsRes, teamsRes] = await Promise.all([
    sb
      .from("football_fixtures")
      .select(FIXTURE_COLUMNS)
      .eq("competition_key", "worldcup")
      .order("kickoff_at", { ascending: true }),
    sb
      .from("football_standings")
      .select("*")
      .eq("competition_key", "worldcup")
      .order("group_name")
      .order("rank"),
    sb
      .from("football_teams")
      .select("api_team_id, name_en, fifa_code, group_name, flag_url")
      .eq("competition_key", "worldcup")
      .order("name_en"),
  ]);

  if (fixturesRes.error) throw fixturesRes.error;
  if (standingsRes.error) throw standingsRes.error;
  if (teamsRes.error) throw teamsRes.error;

  return {
    fixtures: normalizeFixtures((fixturesRes.data ?? []) as FootballFixture[]),
    standings: (standingsRes.data ?? []) as FootballStanding[],
    teams: (teamsRes.data ?? []) as FootballTeam[],
    fetchedAt: null,
    source: "supabase",
    apiError: null,
  };
}

async function fetchLiveFromApi(): Promise<FootballLiveData> {
  const res = await fetch(`/api/football/live?_=${Date.now()}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Football live API ${res.status}`);
  }
  const body = (await res.json()) as {
    fixtures?: FootballFixture[];
    standings?: FootballStanding[];
    teams?: FootballTeam[];
    fetchedAt?: string;
  };
  return {
    fixtures: normalizeFixtures(body.fixtures ?? []),
    standings: body.standings ?? [],
    teams: body.teams ?? [],
    fetchedAt: body.fetchedAt ?? new Date().toISOString(),
    source: "api",
    apiError: null,
  };
}

async function fetchFootballLive(): Promise<FootballLiveData> {
  try {
    return await fetchLiveFromApi();
  } catch (err) {
    const fallback = await fetchLiveFromSupabase();
    return {
      ...fallback,
      apiError: err instanceof Error ? err.message : "Live API unavailable",
    };
  }
}

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

export function useFootballLive() {
  return useQuery({
    queryKey: ["football-live"],
    queryFn: fetchFootballLive,
    staleTime: LIVE_STALE,
    refetchInterval: LIVE_REFETCH,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

export function useFootballFixtures() {
  const query = useFootballLive();
  return {
    ...query,
    data: query.data?.fixtures ?? [],
  };
}

export function useFootballStandings() {
  const query = useFootballLive();
  return {
    ...query,
    data: query.data?.standings ?? [],
  };
}

export function useFootballTeams() {
  const query = useFootballLive();
  return {
    ...query,
    data: query.data?.teams ?? [],
  };
}

export function isToday(iso: string | null, timeZone?: string): boolean {
  return isTodayInTimezone(iso, timeZone);
}

export function isTodayOrTomorrow(iso: string | null, timeZone?: string): boolean {
  return isTodayOrTomorrowInTimezone(iso, timeZone);
}

export function isLive(timeElapsed: string | null): boolean {
  if (!timeElapsed) return false;
  const t = timeElapsed.toLowerCase();
  return t !== "notstarted" && t !== "finished" && t !== "null";
}
