import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { FootballFixture, FootballTeam } from "@/hooks/useFootballData";

export interface FixturePrediction {
  fixtureId: string;
  available: boolean;
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeamName?: string;
  awayTeamName?: string;
  homeWin: number;
  draw: number;
  awayWin: number;
  favoredTeamId: string;
  favoredSide: "home" | "away" | "draw";
  favoredWinProbability: number;
  favoredTeamName?: string;
  isKnockout: boolean;
  pickSide: "home" | "away";
  pickWinProbability: number;
  pickTeamId: string;
  pickTeamName: string;
  actualOutcome?: "home" | "away" | "draw";
  pickCorrect?: boolean;
  resultTone?: "hit" | "draw" | "miss";
  predictionCorrect?: boolean;
  isUpset?: boolean;
}

function teamLookup(teams: FootballTeam[]) {
  const byId = new Map(teams.map((t) => [t.api_team_id, t]));
  return (teamId: string | null | undefined) =>
    teamId ? byId.get(teamId) : undefined;
}

function buildPayload(fixtures: FootballFixture[], teams: FootballTeam[]) {
  const lookup = teamLookup(teams);
  return fixtures.map((f) => {
    const home = lookup(f.home_team_id);
    const away = lookup(f.away_team_id);
    return {
      fixtureId: f.api_fixture_id,
      homeFifaCode: home?.fifa_code ?? null,
      homeName: f.home_team_name ?? home?.name_en ?? null,
      awayFifaCode: away?.fifa_code ?? null,
      awayName: f.away_team_name ?? away?.name_en ?? null,
      matchType: f.match_type,
      isFinished: f.is_finished,
      homeGoals: f.home_goals,
      awayGoals: f.away_goals,
    };
  });
}

async function fetchFixturePredictions(
  fixtures: FootballFixture[],
  teams: FootballTeam[],
  useLiveMetrics: boolean,
): Promise<Map<string, FixturePrediction>> {
  if (fixtures.length === 0) return new Map();

  const res = await fetch("/api/fixture-predictions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fixtures: buildPayload(fixtures, teams),
      useLiveMetrics: useLiveMetrics ? "1" : "0",
    }),
  });

  if (!res.ok) {
    throw new Error(`fixture-predictions ${res.status}`);
  }

  const data = (await res.json()) as { predictions: FixturePrediction[] };
  return new Map(data.predictions.map((p) => [p.fixtureId, p]));
}

export function useFixturePredictions(
  fixtures: FootballFixture[],
  teams: FootballTeam[],
  options?: { enabled?: boolean; useLiveMetrics?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const useLiveMetrics = options?.useLiveMetrics ?? false;

  const fixtureKey = useMemo(
    () =>
      fixtures
        .map(
          (f) =>
            `${f.api_fixture_id}:${f.is_finished ? 1 : 0}:${f.home_goals ?? ""}:${f.away_goals ?? ""}`,
        )
        .join("|"),
    [fixtures],
  );

  const query = useQuery({
    queryKey: ["fixture-predictions", fixtureKey, useLiveMetrics],
    queryFn: () => fetchFixturePredictions(fixtures, teams, useLiveMetrics),
    enabled: enabled && fixtures.length > 0 && teams.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return {
    predictions: query.data ?? new Map<string, FixturePrediction>(),
    isLoading: query.isLoading,
  };
}
