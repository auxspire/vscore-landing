import { TEAMS } from "../data/teams";
import { getSupabaseAdmin } from "../lib/supabase-admin";
import { logger } from "../lib/logger";

export type EloAdjustments = Record<string, number>;

const CACHE_MS = 5 * 60 * 1000;
let cached: { at: number; data: EloAdjustments } | null = null;

const FORM_WEIGHT = 20;
const STANDINGS_WEIGHT = 10;
const MAX_ADJUSTMENT = 30;
const FORM_MATCHES = 5;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Map simulator team id → worldcup26 api_team_id */
function buildTeamIdMap(
  dbTeams: Array<{ api_team_id: string; name_en: string; fifa_code: string | null }>,
): Map<string, string> {
  const byFifa = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const t of dbTeams) {
    if (t.fifa_code) byFifa.set(t.fifa_code.toUpperCase(), t.api_team_id);
    byName.set(normalizeName(t.name_en), t.api_team_id);
  }

  const map = new Map<string, string>();
  for (const team of TEAMS) {
    const fifa = team.flagCode.replace(/-.*/, "").toUpperCase();
    if (byFifa.has(fifa)) {
      map.set(team.id, byFifa.get(fifa)!);
      continue;
    }
    const norm = normalizeName(team.name);
    const altNorm = normalizeName(team.id.replace(/_/g, " "));
    if (byName.has(norm)) {
      map.set(team.id, byName.get(norm)!);
    } else if (byName.has(altNorm)) {
      map.set(team.id, byName.get(altNorm)!);
    }
  }
  return map;
}

function computeFormScore(
  apiTeamId: string,
  fixtures: Array<{
    home_team_id: string | null;
    away_team_id: string | null;
    home_goals: number | null;
    away_goals: number | null;
    is_finished: boolean;
    kickoff_at: string | null;
  }>,
): number {
  const played = fixtures
    .filter((f) => f.is_finished && f.kickoff_at)
    .filter((f) => f.home_team_id === apiTeamId || f.away_team_id === apiTeamId)
    .sort((a, b) => (b.kickoff_at! > a.kickoff_at! ? 1 : -1))
    .slice(0, FORM_MATCHES);

  if (played.length === 0) return 0;

  let pts = 0;
  for (const m of played) {
    const isHome = m.home_team_id === apiTeamId;
    const gf = isHome ? (m.home_goals ?? 0) : (m.away_goals ?? 0);
    const ga = isHome ? (m.away_goals ?? 0) : (m.home_goals ?? 0);
    if (gf > ga) pts += 1;
    else if (gf === ga) pts += 0.5;
  }
  return (pts / played.length - 0.5) * 2;
}

export async function getLiveEloAdjustments(): Promise<EloAdjustments> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.data;

  const sb = getSupabaseAdmin();
  if (!sb) return {};

  try {
    const [{ data: dbTeams }, { data: standings }, { data: fixtures }] = await Promise.all([
      sb.from("football_teams").select("api_team_id, name_en, fifa_code").eq("competition_key", "worldcup"),
      sb.from("football_standings").select("team_id, rank, points, goal_difference, group_name").eq("competition_key", "worldcup"),
      sb.from("football_fixtures").select("home_team_id, away_team_id, home_goals, away_goals, is_finished, kickoff_at").eq("competition_key", "worldcup"),
    ]);

    if (!dbTeams?.length) return {};

    const slugToApi = buildTeamIdMap(dbTeams);
    const standingsByApi = new Map<string, { rank: number; points: number; gd: number }>();
    for (const s of standings ?? []) {
      if (s.rank != null) {
        standingsByApi.set(String(s.team_id), {
          rank: s.rank,
          points: s.points ?? 0,
          gd: s.goal_difference ?? 0,
        });
      }
    }

    const adjustments: EloAdjustments = {};
    for (const team of TEAMS) {
      const apiId = slugToApi.get(team.id);
      if (!apiId) continue;

      const form = computeFormScore(apiId, fixtures ?? []);
      const st = standingsByApi.get(apiId);
      const standingsScore = st
        ? clamp((4 - st.rank) / 3 + st.gd / 10 + st.points / 20, -1, 1)
        : 0;

      const delta = clamp(
        form * FORM_WEIGHT + standingsScore * STANDINGS_WEIGHT,
        -MAX_ADJUSTMENT,
        MAX_ADJUSTMENT,
      );
      if (Math.abs(delta) > 0.5) adjustments[team.id] = Math.round(delta);
    }

    cached = { at: Date.now(), data: adjustments };
    return adjustments;
  } catch (err) {
    logger.warn({ err }, "live metrics load failed — using pure Elo");
    return {};
  }
}

export function parseUseLiveMetrics(value: unknown): boolean {
  return value === "1" || value === "true" || value === true;
}
