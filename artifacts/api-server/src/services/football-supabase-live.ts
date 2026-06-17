import { WORLD_CUP26_CONFIG } from "@workspace/football-config";
import { getSupabaseAdmin } from "../lib/supabase-admin";
import {
  normalizeFixtureRow,
  type FixtureLike,
} from "./match-status";
import { parseScorers } from "./worldcup26-client";
import type {
  FootballFixtureDto,
  FootballLivePayload,
  FootballStandingDto,
  FootballTeamDto,
} from "./football-live";

const FIXTURE_COLUMNS =
  "api_fixture_id, kickoff_at, home_team_id, home_team_name, away_team_id, away_team_name, home_goals, away_goals, home_scorers, away_scorers, group_name, match_type, time_elapsed, is_finished, last_synced_at";

function coerceScorerField(raw: unknown): unknown[] | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    if (raw.length === 0) return null;
    const flat: unknown[] = [];
    for (const item of raw) {
      if (typeof item === "string") flat.push(...parseScorers(item));
      else flat.push(item);
    }
    return flat.length > 0 ? flat : null;
  }
  if (typeof raw === "string") {
    const parsed = parseScorers(raw);
    return parsed.length > 0 ? parsed : null;
  }
  if (typeof raw === "object") return [raw];
  return null;
}

function mapFixtureRow(row: Record<string, unknown>): FootballFixtureDto {
  const base: FootballFixtureDto = {
    api_fixture_id: String(row.api_fixture_id),
    kickoff_at: (row.kickoff_at as string | null) ?? null,
    home_team_id: (row.home_team_id as string | null) ?? null,
    home_team_name: (row.home_team_name as string | null) ?? null,
    away_team_id: (row.away_team_id as string | null) ?? null,
    away_team_name: (row.away_team_name as string | null) ?? null,
    home_goals: row.home_goals as number | null,
    away_goals: row.away_goals as number | null,
    home_scorers: coerceScorerField(row.home_scorers),
    away_scorers: coerceScorerField(row.away_scorers),
    group_name: (row.group_name as string | null) ?? null,
    match_type: (row.match_type as string | null) ?? null,
    time_elapsed: (row.time_elapsed as string | null) ?? null,
    is_finished: Boolean(row.is_finished),
  };
  return normalizeFixtureRow(base as FixtureLike & FootballFixtureDto);
}

export async function fetchFootballLiveFromSupabase(): Promise<FootballLivePayload | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const key = WORLD_CUP26_CONFIG.competitionKey;

  const [fixturesRes, standingsRes, teamsRes, syncRes] = await Promise.all([
    sb
      .from("football_fixtures")
      .select(FIXTURE_COLUMNS)
      .eq("competition_key", key)
      .order("kickoff_at", { ascending: true }),
    sb
      .from("football_standings")
      .select("*")
      .eq("competition_key", key)
      .order("group_name")
      .order("rank"),
    sb
      .from("football_teams")
      .select("api_team_id, name_en, fifa_code, group_name, flag_url")
      .eq("competition_key", key)
      .order("name_en"),
    sb
      .from("football_api_sync_state")
      .select("last_synced_at")
      .eq("competition_key", key)
      .order("last_synced_at", { ascending: false })
      .limit(1),
  ]);

  if (fixturesRes.error) throw fixturesRes.error;
  if (standingsRes.error) throw standingsRes.error;
  if (teamsRes.error) throw teamsRes.error;

  const fixtures = (fixturesRes.data ?? []).map((row) =>
    mapFixtureRow(row as Record<string, unknown>),
  );

  const fetchedAt =
    (syncRes.data?.[0] as { last_synced_at?: string | null } | undefined)?.last_synced_at ??
    new Date().toISOString();

  return {
    fixtures,
    standings: (standingsRes.data ?? []) as FootballStandingDto[],
    teams: (teamsRes.data ?? []) as FootballTeamDto[],
    fetchedAt,
  };
}
