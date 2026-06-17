import { WORLD_CUP26_CONFIG, type SyncJobName } from "@workspace/football-config";
import { getSupabaseAdmin } from "../lib/supabase-admin";
import { logger } from "../lib/logger";
import {
  fetchGames,
  fetchGroups,
  fetchTeams,
  parseLocalDate,
  parseScorers,
  type WorldCup26Game,
  type WorldCup26Group,
  type WorldCup26Team,
} from "./worldcup26-client";
import { resolveGameFinished } from "./match-status";

export interface SyncJobResult {
  job: SyncJobName;
  status: "success" | "skipped" | "error";
  message?: string;
  recordsUpserted?: number;
}

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

async function getSyncState(job: SyncJobName) {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb
    .from("football_api_sync_state")
    .select("*")
    .eq("job_name", job)
    .eq("competition_key", WORLD_CUP26_CONFIG.competitionKey)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function ensureSyncState(job: SyncJobName) {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");
  const existing = await getSyncState(job);
  if (existing) return existing;
  const { data, error } = await sb
    .from("football_api_sync_state")
    .insert({
      job_name: job,
      provider: WORLD_CUP26_CONFIG.provider,
      competition_key: WORLD_CUP26_CONFIG.competitionKey,
      status: "idle",
      sync_date: utcToday(),
      calls_used_today: 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Sum calls_used_today across all jobs for provider; reset when UTC date changes */
async function checkRateGuard(): Promise<{ allowed: boolean; reason?: string }> {
  const sb = getSupabaseAdmin();
  if (!sb) return { allowed: false, reason: "Supabase not configured" };

  const today = utcToday();
  const { data: rows, error } = await sb
    .from("football_api_sync_state")
    .select("id, calls_used_today, sync_date")
    .eq("provider", WORLD_CUP26_CONFIG.provider);

  if (error) throw error;

  const stale = (rows ?? []).filter((r: { sync_date: string }) => r.sync_date !== today);
  if (stale.length > 0) {
    await sb
      .from("football_api_sync_state")
      .update({ calls_used_today: 0, sync_date: today })
      .eq("provider", WORLD_CUP26_CONFIG.provider);
  }

  const total = (rows ?? []).reduce((s: number, r: { sync_date: string; calls_used_today: number }) => s + (r.sync_date === today ? r.calls_used_today : 0), 0);
  if (total >= WORLD_CUP26_CONFIG.dailySoftLimit) {
    return {
      allowed: false,
      reason: `Daily soft limit reached (${total}/${WORLD_CUP26_CONFIG.dailySoftLimit})`,
    };
  }
  return { allowed: true };
}

async function incrementCallCount(job: SyncJobName) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const row = await ensureSyncState(job);
  await sb
    .from("football_api_sync_state")
    .update({
      calls_used_today: (row.calls_used_today ?? 0) + 1,
      sync_date: utcToday(),
    })
    .eq("id", row.id);
}

async function updateJobState(
  job: SyncJobName,
  patch: {
    status: string;
    error_message?: string | null;
    last_synced_at?: string;
    next_sync_at?: string;
  },
) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const row = await ensureSyncState(job);
  await sb.from("football_api_sync_state").update(patch).eq("id", row.id);
}

function mapGameToRow(game: WorldCup26Game, syncedAt: string) {
  const kickoff = parseLocalDate(game.local_date, game.stadium_id);
  const homeGoals = parseInt(game.home_score, 10);
  const awayGoals = parseInt(game.away_score, 10);
  return {
    provider: WORLD_CUP26_CONFIG.provider,
    api_fixture_id: game.id,
    competition_key: WORLD_CUP26_CONFIG.competitionKey,
    group_name: game.group,
    round: game.type,
    status_short: game.time_elapsed,
    status_long: game.finished,
    kickoff_at: kickoff,
    home_team_id: game.home_team_id,
    home_team_name: game.home_team_name_en ?? game.home_team_label ?? null,
    away_team_id: game.away_team_id,
    away_team_name: game.away_team_name_en ?? game.away_team_label ?? null,
    home_goals: Number.isNaN(homeGoals) ? null : homeGoals,
    away_goals: Number.isNaN(awayGoals) ? null : awayGoals,
    home_scorers: parseScorers(game.home_scorers),
    away_scorers: parseScorers(game.away_scorers),
    match_type: game.type,
    matchday: game.matchday,
    time_elapsed: game.time_elapsed,
    is_finished: resolveGameFinished(game),
    stadium_id: game.stadium_id,
    home_team_label: game.home_team_label ?? null,
    away_team_label: game.away_team_label ?? null,
    raw_payload: game,
    last_synced_at: syncedAt,
  };
}

async function upsertGames(games: WorldCup26Game[]): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");
  const syncedAt = new Date().toISOString();
  const rows = games.map((g) => mapGameToRow(g, syncedAt));
  const { error } = await sb.from("football_fixtures").upsert(rows, {
    onConflict: "competition_key,api_fixture_id",
  });
  if (error) throw error;
  return rows.length;
}

async function upsertGroups(groups: WorldCup26Group[]): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");
  const syncedAt = new Date().toISOString();

  const { data: teamRows } = await sb
    .from("football_teams")
    .select("api_team_id, name_en")
    .eq("competition_key", WORLD_CUP26_CONFIG.competitionKey);
  const nameById = Object.fromEntries(
    (teamRows ?? []).map((t: { api_team_id: string; name_en: string }) => [t.api_team_id, t.name_en]),
  );

  const rows: Record<string, unknown>[] = [];

  for (const g of groups) {
    const groupName = g.name ?? g.group;
    if (!groupName) continue;
    const sorted = [...g.teams].sort((a, b) => {
      const ptsDiff = parseInt(b.pts, 10) - parseInt(a.pts, 10);
      if (ptsDiff !== 0) return ptsDiff;
      const gdA = parseInt(a.gf, 10) - parseInt(a.ga, 10);
      const gdB = parseInt(b.gf, 10) - parseInt(b.ga, 10);
      return gdB - gdA;
    });
    sorted.forEach((t, idx) => {
      const gf = parseInt(t.gf, 10) || 0;
      const ga = parseInt(t.ga, 10) || 0;
      rows.push({
        provider: WORLD_CUP26_CONFIG.provider,
        competition_key: WORLD_CUP26_CONFIG.competitionKey,
        group_name: groupName,
        rank: idx + 1,
        team_id: t.team_id,
        team_name: nameById[t.team_id] ?? null,
        played: t.mp != null ? parseInt(t.mp, 10) || 0 : null,
        won: t.w != null ? parseInt(t.w, 10) || 0 : null,
        drawn: t.d != null ? parseInt(t.d, 10) || 0 : null,
        lost: t.l != null ? parseInt(t.l, 10) || 0 : null,
        goals_for: gf,
        goals_against: ga,
        goal_difference: gf - ga,
        points: parseInt(t.pts, 10) || 0,
        raw_payload: t,
        last_synced_at: syncedAt,
      });
    });
  }

  const { error } = await sb.from("football_standings").upsert(rows, {
    onConflict: "competition_key,group_name,team_id",
  });
  if (error) throw error;
  return rows.length;
}

async function upsertTeams(teams: WorldCup26Team[]): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");
  const syncedAt = new Date().toISOString();
  const rows = teams.map((t) => ({
    provider: WORLD_CUP26_CONFIG.provider,
    competition_key: WORLD_CUP26_CONFIG.competitionKey,
    api_team_id: t.id,
    name_en: t.name_en,
    name_fa: t.name_fa ?? null,
    fifa_code: t.fifa_code ?? null,
    group_name: t.groups,
    flag_url: t.flag ?? null,
    raw_payload: t,
    last_synced_at: syncedAt,
  }));
  const { error } = await sb.from("football_teams").upsert(rows, {
    onConflict: "competition_key,api_team_id",
  });
  if (error) throw error;
  return rows.length;
}

export async function runSyncJob(job: SyncJobName, force = false): Promise<SyncJobResult> {
  if (!getSupabaseAdmin()) {
    return { job, status: "skipped", message: "Supabase not configured" };
  }

  try {
    const state = await ensureSyncState(job);
    const interval = WORLD_CUP26_CONFIG.syncIntervalsMs[job];
    if (!force && state.next_sync_at && new Date(state.next_sync_at) > new Date()) {
      return { job, status: "skipped", message: "Not yet due" };
    }

    const guard = await checkRateGuard();
    if (!guard.allowed) {
      await updateJobState(job, { status: "skipped", error_message: guard.reason ?? null });
      return { job, status: "skipped", message: guard.reason };
    }

    await updateJobState(job, { status: "running", error_message: null });

    let count = 0;
    if (job === "games") {
      await incrementCallCount(job);
      const games = await fetchGames();
      count = await upsertGames(games);
    } else if (job === "groups") {
      await incrementCallCount(job);
      const groups = await fetchGroups();
      count = await upsertGroups(groups);
    } else {
      await incrementCallCount(job);
      const teams = await fetchTeams();
      count = await upsertTeams(teams);
    }

    const now = new Date();
    await updateJobState(job, {
      status: "success",
      error_message: null,
      last_synced_at: now.toISOString(),
      next_sync_at: new Date(now.getTime() + interval).toISOString(),
    });

    return { job, status: "success", recordsUpserted: count };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    logger.error({ err, job }, "football sync error");
    await updateJobState(job, { status: "error", error_message: message }).catch(() => {});
    return { job, status: "error", message };
  }
}

export async function runAllSyncJobs(force = false): Promise<SyncJobResult[]> {
  // Teams first so standings upsert can resolve team names
  const jobs: SyncJobName[] = ["teams", "groups", "games"];
  const results: SyncJobResult[] = [];
  for (const job of jobs) {
    results.push(await runSyncJob(job, force));
  }
  return results;
}
