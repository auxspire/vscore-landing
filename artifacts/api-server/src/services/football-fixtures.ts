import {
  fetchGames,
  isFinished,
  parseLocalDate,
  parseScorers,
  type WorldCup26Game,
} from "./worldcup26-client";

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

export function mapGameToFixtureDto(game: WorldCup26Game): FootballFixtureDto {
  const homeGoals = parseInt(game.home_score, 10);
  const awayGoals = parseInt(game.away_score, 10);
  return {
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
    is_finished: isFinished(game.finished),
  };
}

export async function fetchLatestFixtures(): Promise<FootballFixtureDto[]> {
  const games = await fetchGames();
  return games
    .map(mapGameToFixtureDto)
    .sort((a, b) => (a.kickoff_at ?? "").localeCompare(b.kickoff_at ?? ""));
}
