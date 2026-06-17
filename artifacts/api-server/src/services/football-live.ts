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

/** Client-facing fixture row (matches worldcup FootballFixture). */
export interface FootballFixtureDto {
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

export interface FootballStandingDto {
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

export interface FootballTeamDto {
  api_team_id: string;
  name_en: string;
  fifa_code: string | null;
  group_name: string | null;
  flag_url: string | null;
}

export interface FootballLivePayload {
  fixtures: FootballFixtureDto[];
  standings: FootballStandingDto[];
  teams: FootballTeamDto[];
  fetchedAt: string;
}

export function mapGameToFixtureDto(game: WorldCup26Game, nowMs = Date.now()): FootballFixtureDto {
  const homeGoals = parseInt(game.home_score, 10);
  const awayGoals = parseInt(game.away_score, 10);
  const row: FootballFixtureDto = {
    api_fixture_id: game.id,
    kickoff_at: parseLocalDate(game.local_date, game.stadium_id),
    home_team_id: game.home_team_id,
    home_team_name: game.home_team_name_en ?? game.home_team_label ?? null,
    away_team_id: game.away_team_id,
    away_team_name: game.away_team_name_en ?? game.away_team_label ?? null,
    home_goals: Number.isNaN(homeGoals) ? null : homeGoals,
    away_goals: Number.isNaN(awayGoals) ? null : awayGoals,
    home_scorers: parseScorers(game.home_scorers),
    away_scorers: parseScorers(game.away_scorers),
    group_name: game.group,
    match_type: game.type,
    time_elapsed: game.time_elapsed,
    is_finished: resolveGameFinished(game, nowMs),
  };
  return row;
}

export function mapTeamToDto(team: WorldCup26Team): FootballTeamDto {
  return {
    api_team_id: team.id,
    name_en: team.name_en,
    fifa_code: team.fifa_code ?? null,
    group_name: team.groups,
    flag_url: team.flag ?? null,
  };
}

export function mapGroupsToStandings(
  groups: WorldCup26Group[],
  nameById: Record<string, string>,
): FootballStandingDto[] {
  const rows: FootballStandingDto[] = [];

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
      });
    });
  }

  return rows.sort((a, b) => a.group_name.localeCompare(b.group_name) || (a.rank ?? 0) - (b.rank ?? 0));
}

export async function fetchLatestFixtures(): Promise<FootballFixtureDto[]> {
  const games = await fetchGames();
  return games
    .map(mapGameToFixtureDto)
    .sort((a, b) => (a.kickoff_at ?? "").localeCompare(b.kickoff_at ?? ""));
}

/** Parallel fetch from worldcup26.ir — fixtures, standings, and teams in one round trip. */
export async function fetchLatestFootballLive(): Promise<FootballLivePayload> {
  const [games, groups, teams] = await Promise.all([fetchGames(), fetchGroups(), fetchTeams()]);

  const nameById = Object.fromEntries(teams.map((t) => [t.id, t.name_en]));
  const teamDtos = teams.map(mapTeamToDto).sort((a, b) => a.name_en.localeCompare(b.name_en));

  return {
    fixtures: games
      .map(mapGameToFixtureDto)
      .sort((a, b) => (a.kickoff_at ?? "").localeCompare(b.kickoff_at ?? "")),
    standings: mapGroupsToStandings(groups, nameById),
    teams: teamDtos,
    fetchedAt: new Date().toISOString(),
  };
}
