import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";

export interface Team {
  id: string;
  name: string;
  group: string;
  fifaRanking: number;
  eloRating: number;
  confederation: string;
  flagCode: string;
}

export interface StageProbability {
  stage: string;
  probability: number;
  description: string;
}

export interface MatchProbabilityResult {
  teamA: Team;
  teamB: Team;
  stages: StageProbability[];
  totalProbability: number;
  simulationsRun: number;
  sameGroup: boolean;
}

export interface PopularMatchup {
  teamA: Team;
  teamB: Team;
  totalProbability: number;
  mostLikelyStage: string;
  label: string;
}

export interface BracketOpponent {
  team: Team;
  encounterProbability: number;
  winProbabilityIfFacing: number;
}

export interface BracketStageNode {
  stage: string;
  description: string;
  reachProbability: number;
  topOpponents: BracketOpponent[];
}

export interface BracketExplorerResult {
  team: Team;
  path: BracketStageNode[];
  tournamentWinProbability: number;
  simulationsRun: number;
}

export interface TeamStageBreakdown {
  team: Team;
  stages: { stage: string; probability: number; description: string }[];
}

export interface TeamRanking {
  rank: number;
  team: Team;
  winProbability: number;
  finalProbability: number;
  semifinalProbability: number;
  quarterProbability: number;
  r16Probability: number;
  r32Probability: number;
}

export interface TournamentRankingsResult {
  rankings: TeamRanking[];
  simulationsRun: number;
}

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const getGetTeamsQueryKey = () => ["/api/teams"] as const;

export function useGetTeams(
  options?: { query?: UseQueryOptions<Team[]> }
) {
  return useQuery<Team[]>({
    queryKey: getGetTeamsQueryKey(),
    queryFn: () => apiFetch<Team[]>("/api/teams"),
    ...options?.query,
  });
}

export const getGetPopularMatchupsQueryKey = () => ["/api/popular-matchups"] as const;

export function useGetPopularMatchups(
  options?: { query?: UseQueryOptions<PopularMatchup[]> }
) {
  return useQuery<PopularMatchup[]>({
    queryKey: getGetPopularMatchupsQueryKey(),
    queryFn: () => apiFetch<PopularMatchup[]>("/api/popular-matchups"),
    ...options?.query,
  });
}

export const getGetMatchProbabilityQueryKey = (params: { teamA: string; teamB: string; simulations?: number }) =>
  ["/api/match-probability", params] as const;

export function useGetMatchProbability(
  params: { teamA: string; teamB: string; simulations?: number },
  options?: { query?: UseQueryOptions<MatchProbabilityResult> }
) {
  const qs = new URLSearchParams({ teamA: params.teamA, teamB: params.teamB });
  if (params.simulations != null) qs.set("simulations", String(params.simulations));
  return useQuery<MatchProbabilityResult>({
    queryKey: getGetMatchProbabilityQueryKey(params),
    queryFn: () => apiFetch<MatchProbabilityResult>(`/api/match-probability?${qs}`),
    ...options?.query,
  });
}

export const getGetTeamStageBreakdownQueryKey = (teamId: string) =>
  [`/api/stage-breakdown/${teamId}`] as const;

export function useGetTeamStageBreakdown(
  teamId: string,
  options?: { query?: UseQueryOptions<TeamStageBreakdown> }
) {
  return useQuery<TeamStageBreakdown>({
    queryKey: getGetTeamStageBreakdownQueryKey(teamId),
    queryFn: () => apiFetch<TeamStageBreakdown>(`/api/stage-breakdown/${teamId}`),
    ...options?.query,
  });
}

export const getGetBracketExplorerQueryKey = (teamId: string, params?: { simulations?: number }) =>
  [`/api/bracket-explorer/${teamId}`, params] as const;

export function useGetBracketExplorer(
  teamId: string,
  params?: { simulations?: number },
  options?: { query?: UseQueryOptions<BracketExplorerResult> }
) {
  const qs = new URLSearchParams();
  if (params?.simulations != null) qs.set("simulations", String(params.simulations));
  const url = `/api/bracket-explorer/${teamId}${qs.toString() ? `?${qs}` : ""}`;
  return useQuery<BracketExplorerResult>({
    queryKey: getGetBracketExplorerQueryKey(teamId, params),
    queryFn: () => apiFetch<BracketExplorerResult>(url),
    ...options?.query,
  });
}

export const getGetTournamentRankingsQueryKey = (params?: { simulations?: number }) =>
  ["/api/rankings", params] as const;

export function useGetTournamentRankings(
  params?: { simulations?: number },
  options?: { query?: UseQueryOptions<TournamentRankingsResult> }
) {
  const qs = new URLSearchParams();
  if (params?.simulations != null) qs.set("simulations", String(params.simulations));
  return useQuery<TournamentRankingsResult>({
    queryKey: getGetTournamentRankingsQueryKey(params),
    queryFn: () => apiFetch<TournamentRankingsResult>(`/api/rankings${qs.toString() ? `?${qs}` : ""}`),
    ...options?.query,
  });
}
