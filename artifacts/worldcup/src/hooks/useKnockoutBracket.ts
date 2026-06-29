import { useMemo } from "react";
import { useFootballLive } from "@/hooks/useFootballData";
import { buildKnockoutBracketState, type KnockoutBracketState } from "@/lib/knockout-bracket-state";

export function useKnockoutBracket(): {
  bracket: KnockoutBracketState | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
} {
  const { data, isLoading, isFetching, isError } = useFootballLive();

  const bracket = useMemo(() => {
    if (!data) return null;
    return buildKnockoutBracketState({
      standings: data.standings,
      teams: data.teams,
      fixtures: data.fixtures,
      fetchedAt: data.fetchedAt,
    });
  }, [data]);

  return { bracket, isLoading, isFetching, isError };
}
