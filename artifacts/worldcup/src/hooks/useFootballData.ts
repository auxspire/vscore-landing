import { useMemo } from "react";
import { useQuery, type QueryClient, type UseQueryResult } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { isTodayInTimezone, isTodayOrTomorrowInTimezone } from "@/lib/match-datetime";
import { normalizeFixtures } from "@/lib/fixture-status";
import { aggregateTopScorers, coerceScorerField, type ScorerEntry } from "@/lib/scorer-utils";

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
const CACHE_STALE = 5 * 60 * 1000;
const API_TIMEOUT_MS = 8_000;

export interface FootballLiveData {
  fixtures: FootballFixture[];
  standings: FootballStanding[];
  teams: FootballTeam[];
  fetchedAt: string | null;
  source: "api" | "supabase";
  apiError?: string | null;
}

const FIXTURE_COLUMNS_LITE =
  "api_fixture_id, kickoff_at, home_team_id, home_team_name, away_team_id, away_team_name, home_goals, away_goals, group_name, match_type, time_elapsed, is_finished";

const FIXTURE_SCORER_COLUMNS =
  "api_fixture_id, home_scorers, away_scorers, is_finished, home_team_id, away_team_id";

function mergeFixtureScorers(
  lite: FootballFixture[],
  withScorers: FootballFixture[],
): FootballFixture[] {
  if (withScorers.length === 0) return lite;
  const map = new Map(withScorers.map((f) => [f.api_fixture_id, f]));
  return lite.map((f) => {
    const full = map.get(f.api_fixture_id);
    if (!full) return f;
    const homeScorers =
      full.home_scorers != null && full.home_scorers.length > 0
        ? full.home_scorers
        : f.home_scorers;
    const awayScorers =
      full.away_scorers != null && full.away_scorers.length > 0
        ? full.away_scorers
        : f.away_scorers;
    if (homeScorers === f.home_scorers && awayScorers === f.away_scorers) return f;
    return { ...f, home_scorers: homeScorers, away_scorers: awayScorers };
  });
}

function withCoercedScorers(fixtures: FootballFixture[]): FootballFixture[] {
  return fixtures.map((f) => ({
    ...f,
    home_scorers: coerceScorerField(f.home_scorers),
    away_scorers: coerceScorerField(f.away_scorers),
  }));
}

function fixturesMissingScorers(fixtures: FootballFixture[]): boolean {
  const finished = fixtures.filter((f) => f.is_finished);
  if (finished.length === 0) return false;
  return !finished.some(
    (f) =>
      (f.home_scorers != null && f.home_scorers.length > 0) ||
      (f.away_scorers != null && f.away_scorers.length > 0),
  );
}

async function fetchLiveFromSupabase(options?: {
  includeScorers?: boolean;
}): Promise<FootballLiveData> {
  const sb = getSupabaseBrowserClient();
  if (!sb) {
    return { fixtures: [], standings: [], teams: [], fetchedAt: null, source: "supabase" };
  }

  const [fixturesRes, standingsRes, teamsRes] = await Promise.all([
    sb
      .from("football_fixtures")
      .select(FIXTURE_COLUMNS_LITE)
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

  let fixtures = withCoercedScorers(normalizeFixtures((fixturesRes.data ?? []) as FootballFixture[]));

  if (options?.includeScorers) {
    const scorersRes = await sb
      .from("football_fixtures")
      .select(FIXTURE_SCORER_COLUMNS)
      .eq("competition_key", "worldcup");
    if (!scorersRes.error && scorersRes.data?.length) {
      const scorerRows = withCoercedScorers(
        normalizeFixtures((scorersRes.data ?? []) as FootballFixture[]),
      );
      fixtures = mergeFixtureScorers(fixtures, scorerRows);
    }
  }

  return {
    fixtures,
    standings: (standingsRes.data ?? []) as FootballStanding[],
    teams: (teamsRes.data ?? []) as FootballTeam[],
    fetchedAt: null,
    source: "supabase",
    apiError: null,
  };
}

async function fetchScorersFromSupabase(): Promise<FootballFixture[]> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("football_fixtures")
    .select(FIXTURE_SCORER_COLUMNS)
    .eq("competition_key", "worldcup");
  if (error) throw error;
  return withCoercedScorers(normalizeFixtures((data ?? []) as FootballFixture[]));
}

async function fetchLiveFromApi(): Promise<FootballLiveData> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch("/api/football/live", {
      signal: controller.signal,
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
      source?: "api" | "supabase";
      liveApiError?: string | null;
    };
    return {
      fixtures: withCoercedScorers(normalizeFixtures(body.fixtures ?? [])),
      standings: body.standings ?? [],
      teams: body.teams ?? [],
      fetchedAt: body.fetchedAt ?? new Date().toISOString(),
      source: body.source ?? "api",
      apiError: body.liveApiError ?? null,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`Football live API timed out after ${API_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function buildLiveData(
  cache: FootballLiveData | undefined,
  api: FootballLiveData | undefined,
  scorersOverlay: FootballFixture[] | undefined,
  apiError: string | null,
): FootballLiveData | undefined {
  const base = api ?? cache;
  if (!base) return undefined;

  let fixtures = base.fixtures;
  if (scorersOverlay?.length) {
    fixtures = mergeFixtureScorers(fixtures, scorersOverlay);
  }

  return {
    fixtures,
    standings: base.standings,
    teams: base.teams,
    fetchedAt: api?.fetchedAt ?? cache?.fetchedAt ?? null,
    source: api?.source ?? cache?.source ?? "supabase",
    apiError: api?.apiError ?? apiError,
  };
}

export function prefetchFootballLiveCache(queryClient: QueryClient) {
  return queryClient.prefetchQuery({
    queryKey: ["football-live", "cache", "lite"],
    queryFn: () => fetchLiveFromSupabase(),
    staleTime: CACHE_STALE,
  });
}

export function prefetchFootballLivePanel() {
  return import("@/components/WorldCupFixturesStandingsPanel");
}

function sbQuery<T>(
  key: string[],
  fetcher: () => Promise<T>,
  options?: { refetchInterval?: number; enabled?: boolean },
) {
  return useQuery({
    queryKey: key,
    queryFn: fetcher,
    staleTime: STALE,
    retry: 1,
    refetchInterval: options?.refetchInterval,
    enabled: options?.enabled ?? true,
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

export function useFootballSyncJobs(options?: { enabled?: boolean }) {
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
    { refetchInterval: SYNC_POLL, enabled: options?.enabled },
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

type FootballLiveQuery = Pick<
  UseQueryResult<FootballLiveData>,
  "data" | "isLoading" | "isError" | "isFetching" | "error"
> & { isScorersLoading: boolean };

export function useFootballLive(options?: { needScorers?: boolean }): FootballLiveQuery {
  const needScorers = options?.needScorers ?? false;

  const cacheQuery = useQuery({
    queryKey: ["football-live", "cache", needScorers ? "with-scorers" : "lite"],
    queryFn: () => fetchLiveFromSupabase({ includeScorers: needScorers }),
    staleTime: CACHE_STALE,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });

  const apiQuery = useQuery({
    queryKey: ["football-live", "api"],
    queryFn: fetchLiveFromApi,
    staleTime: LIVE_STALE,
    refetchInterval: LIVE_REFETCH,
    refetchOnWindowFocus: true,
    retry: false,
  });

  const mergedFixtures = useMemo(() => {
    const base = apiQuery.data ?? cacheQuery.data;
    if (!base) return [];
    return base.fixtures;
  }, [apiQuery.data, cacheQuery.data]);

  const shouldFetchScorers = needScorers && fixturesMissingScorers(mergedFixtures);

  const scorersQuery = useQuery({
    queryKey: ["football-live", "scorers"],
    queryFn: fetchScorersFromSupabase,
    staleTime: CACHE_STALE,
    enabled: shouldFetchScorers,
    retry: 1,
  });

  const apiError = useMemo(() => {
    if (apiQuery.data?.source === "api") return null;
    if (apiQuery.data?.apiError) return apiQuery.data.apiError;
    if (cacheQuery.data && apiQuery.isError && !apiQuery.data) return null;
    if (apiQuery.isError && !apiQuery.data) {
      return apiQuery.error instanceof Error
        ? apiQuery.error.message
        : "Live API unavailable";
    }
    return null;
  }, [apiQuery.data, apiQuery.isError, apiQuery.error, cacheQuery.data]);

  const data = useMemo(
    () => buildLiveData(cacheQuery.data, apiQuery.data, scorersQuery.data, apiError),
    [cacheQuery.data, apiQuery.data, scorersQuery.data, apiError],
  );

  const isLoading = !data && cacheQuery.isLoading;
  const isFetching =
    apiQuery.isFetching ||
    cacheQuery.isFetching ||
    (shouldFetchScorers && scorersQuery.isFetching);
  const isError = !data && cacheQuery.isError && apiQuery.isError;

  return {
    data,
    isLoading,
    isFetching,
    isError,
    error: cacheQuery.error ?? apiQuery.error,
    isScorersLoading: shouldFetchScorers && scorersQuery.isLoading,
  };
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
