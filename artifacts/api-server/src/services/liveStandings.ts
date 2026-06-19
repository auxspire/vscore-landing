import { TEAMS, type Team } from "../data/teams";
import { getSupabaseAdmin } from "../lib/supabase-admin";
import { logger } from "../lib/logger";
import { buildTeamIdMap } from "./liveMetrics";
import {
  buildBracket,
  get8BestThirds,
  R32_FIXTURE_SPEC,
  THIRD_SLOT_POOLS,
  type GroupResult,
  type ThirdPlaceCandidate,
} from "./bracketBuilder";

export type GroupFinish = "1st" | "2nd" | "3rd" | "eliminated";

export interface LiveStandingRow {
  simulatorTeamId: string;
  apiTeamId: string;
  group: string;
  rank: number;
  points: number;
  gd: number;
  goalsFor: number;
  finish: GroupFinish;
}

export interface StandingR32Opponent {
  teamId: string;
  name: string;
  group: string;
  finish: GroupFinish;
  pairingType: "third_place" | "runner_up" | "winner";
  slotLabel: string;
}

export interface LiveStandingsContext {
  bySimulatorId: Map<string, LiveStandingRow>;
  allThirdCandidates: ThirdPlaceCandidate[];
  qualifiedThirdGroups: Set<string>;
  groupResults: Record<string, GroupResult[]>;
  bracket: Team[] | null;
  asOf: string;
  available: boolean;
}

const CACHE_MS = 5 * 60 * 1000;
let cached: { at: number; data: LiveStandingsContext | null } | null = null;

function rankToFinish(
  rank: number,
  group: string,
  qualifiedThirdGroups: Set<string>,
): GroupFinish {
  if (rank === 1) return "1st";
  if (rank === 2) return "2nd";
  if (rank === 3) return qualifiedThirdGroups.has(group) ? "3rd" : "eliminated";
  return "eliminated";
}

function inferPairingType(
  slotLabel: string,
  opponentFinish: GroupFinish,
): StandingR32Opponent["pairingType"] {
  if (opponentFinish === "3rd" || slotLabel.includes("3rd")) return "third_place";
  if (slotLabel.includes("2") && slotLabel.split(" vs ").every((p) => p.startsWith("2"))) {
    return "runner_up";
  }
  return "winner";
}

function findR32OpponentForSlot(
  bracket: Team[],
  teamId: string,
): { opponent: Team; slotLabel: string; teamSlot: number } | null {
  const teamSlot = bracket.findIndex((t) => t.id === teamId);
  if (teamSlot < 0) return null;

  for (const { label, slots } of R32_FIXTURE_SPEC) {
    const [a, b] = slots;
    if (a === teamSlot) return { opponent: bracket[b], slotLabel: label, teamSlot };
    if (b === teamSlot) return { opponent: bracket[a], slotLabel: label, teamSlot };
  }
  return null;
}

function validateThirdPlacePool(teamSlot: number, opponentGroup: string): boolean {
  const pool = THIRD_SLOT_POOLS[teamSlot];
  if (!pool) return true;
  return pool.includes(opponentGroup);
}

export function resolveStandingR32Opponent(
  team: Team,
  standing: LiveStandingRow,
  ctx: LiveStandingsContext,
): StandingR32Opponent | null {
  if (standing.finish === "eliminated" || !ctx.bracket) return null;

  const match = findR32OpponentForSlot(ctx.bracket, team.id);
  if (!match) return null;

  const oppRow = ctx.bySimulatorId.get(match.opponent.id);
  const oppFinish = oppRow?.finish ?? (match.opponent.id ? "2nd" : "eliminated");

  if (standing.finish === "1st" && oppFinish === "3rd") {
    if (!validateThirdPlacePool(match.teamSlot, match.opponent.group)) {
      logger.warn(
        { team: team.id, slot: match.teamSlot, opponentGroup: match.opponent.group },
        "standing R32 third-place pool violation",
      );
    }
  }

  return {
    teamId: match.opponent.id,
    name: match.opponent.name,
    group: match.opponent.group,
    finish: oppFinish === "eliminated" ? "2nd" : oppFinish,
    pairingType: inferPairingType(match.slotLabel, oppFinish),
    slotLabel: match.slotLabel,
  };
}

export async function getLiveStandingsContext(): Promise<LiveStandingsContext | null> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.data;

  const sb = getSupabaseAdmin();
  if (!sb) {
    cached = { at: Date.now(), data: null };
    return null;
  }

  try {
    const [{ data: dbTeams }, { data: standings }] = await Promise.all([
      sb
        .from("football_teams")
        .select("api_team_id, name_en, fifa_code")
        .eq("competition_key", "worldcup"),
      sb
        .from("football_standings")
        .select("team_id, rank, points, goal_difference, goals_for, group_name")
        .eq("competition_key", "worldcup"),
    ]);

    if (!dbTeams?.length || !standings?.length) {
      cached = { at: Date.now(), data: null };
      return null;
    }

    const slugToApi = buildTeamIdMap(dbTeams);
    const apiToSimulator = new Map<string, string>();
    for (const [simId, apiId] of slugToApi) {
      apiToSimulator.set(apiId, simId);
    }

    const standingsByApi = new Map<
      string,
      { rank: number; points: number; gd: number; goalsFor: number; group: string }
    >();
    for (const s of standings) {
      if (s.rank == null || !s.group_name) continue;
      standingsByApi.set(String(s.team_id), {
        rank: s.rank,
        points: s.points ?? 0,
        gd: s.goal_difference ?? 0,
        goalsFor: s.goals_for ?? 0,
        group: String(s.group_name).toUpperCase(),
      });
    }

    const allThirdCandidates: ThirdPlaceCandidate[] = [];
    const groupResults: Record<string, GroupResult[]> = {};

    for (const group of "ABCDEFGHIJKL".split("")) {
      const groupTeams = TEAMS.filter((t) => t.group === group);
      let winner: GroupResult | null = null;
      let runnerUp: GroupResult | null = null;

      for (const t of groupTeams) {
        const apiId = slugToApi.get(t.id);
        if (!apiId) continue;
        const st = standingsByApi.get(apiId);
        if (!st || st.group !== group) continue;

        const row: GroupResult = {
          team: t,
          points: st.points,
          gd: st.gd,
          goalsFor: st.goalsFor,
          position: st.rank,
        };

        if (st.rank === 1) winner = row;
        else if (st.rank === 2) runnerUp = row;
        else if (st.rank === 3) {
          allThirdCandidates.push({
            team: t,
            points: st.points,
            gd: st.gd,
            goalsFor: st.goalsFor,
          });
        }
      }

      if (winner && runnerUp) {
        groupResults[group] = [winner, runnerUp];
      }
    }

    const qualifiedThirds = get8BestThirds(allThirdCandidates);
    const qualifiedThirdGroups = new Set(qualifiedThirds.map((t) => t.group));

    const bySimulatorId = new Map<string, LiveStandingRow>();
    for (const team of TEAMS) {
      const apiId = slugToApi.get(team.id);
      if (!apiId) continue;
      const st = standingsByApi.get(apiId);
      if (!st) continue;

      bySimulatorId.set(team.id, {
        simulatorTeamId: team.id,
        apiTeamId: apiId,
        group: team.group,
        rank: st.rank,
        points: st.points,
        gd: st.gd,
        goalsFor: st.goalsFor,
        finish: rankToFinish(st.rank, team.group, qualifiedThirdGroups),
      });
    }

    let bracket: Team[] | null = null;
    const groupsComplete = Object.keys(groupResults).length === 12;
    if (groupsComplete && allThirdCandidates.length >= 8) {
      try {
        bracket = buildBracket(groupResults, allThirdCandidates);
      } catch (err) {
        logger.warn({ err }, "live standings bracket build failed");
      }
    }

    const asOf = new Date().toISOString();
    const data: LiveStandingsContext = {
      bySimulatorId,
      allThirdCandidates,
      qualifiedThirdGroups,
      groupResults,
      bracket,
      asOf,
      available: bySimulatorId.size > 0 && bracket !== null,
    };

    cached = { at: Date.now(), data };
    return data;
  } catch (err) {
    logger.warn({ err }, "live standings load failed");
    cached = { at: Date.now(), data: null };
    return null;
  }
}

export function getLiveStandingForTeam(
  ctx: LiveStandingsContext,
  teamId: string,
): LiveStandingRow | null {
  return ctx.bySimulatorId.get(teamId) ?? null;
}

export function parseUseGroupStandings(value: unknown): boolean {
  return value === "1" || value === "true" || value === true;
}
