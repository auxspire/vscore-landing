import { useMemo, useState } from "react";
import { useGetTournamentRankings, getGetTournamentRankingsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { QueryErrorState } from "@/components/QueryErrorState";
import { TeamFlag } from "@/components/TeamFlag";
import { cn } from "@/lib/utils";
import { simulationCount } from "@/lib/simulation-config";
import {
  Trophy,
  Medal,
  Activity,
  ChevronRight,
  ChevronDown,
  Search,
  BarChart3,
  X,
} from "lucide-react";

const STAGES = [
  { key: "r32Probability", label: "R32", short: "R32" },
  { key: "r16Probability", label: "R16", short: "R16" },
  { key: "quarterProbability", label: "QF", short: "QF" },
  { key: "semifinalProbability", label: "SF", short: "SF" },
  { key: "finalProbability", label: "Final", short: "F" },
  { key: "winProbability", label: "Win", short: "W" },
] as const;

type StageKey = (typeof STAGES)[number]["key"];
type SortKey = StageKey | "rank";

function rankMedal(rank: number) {
  if (rank === 1) return <Trophy className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
  if (rank === 2) return <Medal className="w-3.5 h-3.5 text-slate-300 shrink-0" />;
  if (rank === 3) return <Medal className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
  return (
    <span className="text-[10px] font-mono text-muted-foreground w-4 text-center shrink-0 tabular-nums">
      {rank}
    </span>
  );
}

function winColor(prob: number) {
  if (prob >= 0.12) return "text-primary";
  if (prob >= 0.06) return "text-amber-400";
  if (prob >= 0.03) return "text-orange-400";
  return "text-muted-foreground";
}

interface PowerRankingsPanelProps {
  onTeamSelect?: (teamId: string) => void;
  /** Keeps the Path tab short until the user opens rankings */
  defaultCollapsed?: boolean;
}

export function PowerRankingsPanel({
  onTeamSelect,
  defaultCollapsed = true,
}: PowerRankingsPanelProps) {
  const [expanded, setExpanded] = useState(!defaultCollapsed);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("rank");
  const rankParams = { simulations: simulationCount() };

  const { data, isLoading, isError, refetch } = useGetTournamentRankings(rankParams, {
    query: { staleTime: 5 * 60 * 1000, queryKey: getGetTournamentRankingsQueryKey(rankParams) },
  });

  const sorted = useMemo(() => {
    if (!data?.rankings) return [];
    const base =
      sortBy === "rank"
        ? [...data.rankings]
        : [...data.rankings].sort((a, b) => {
            const aVal = a[sortBy as StageKey] ?? 0;
            const bVal = b[sortBy as StageKey] ?? 0;
            return (bVal as number) - (aVal as number);
          });
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter((entry) => {
      const { name, group, flagCode, id } = entry.team;
      return (
        name.toLowerCase().includes(q) ||
        group.toLowerCase().includes(q) ||
        flagCode.toLowerCase().includes(q) ||
        id.toLowerCase().includes(q)
      );
    });
  }, [data?.rankings, sortBy, search]);

  const topThree = data?.rankings?.slice(0, 3) ?? [];

  const handleTeamClick = (teamId: string) => {
    onTeamSelect?.(teamId);
    if (onTeamSelect) setExpanded(false);
  };

  return (
    <Card className="bg-card border-border shadow-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-secondary/30 transition-colors border-b border-border/30"
        aria-expanded={expanded}
      >
        <BarChart3 className="w-4 h-4 text-amber-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
            Power Rankings
          </div>
          {!expanded && topThree.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
              {topThree.map((e) => (
                <span key={e.team.id} className="inline-flex items-center gap-1 whitespace-nowrap">
                  <TeamFlag flagCode={e.team.flagCode} size={22} />
                  <span className="truncate max-w-[5rem]">{e.team.name}</span>
                  <span className={cn("font-mono font-bold", winColor(e.winProbability))}>
                    {(e.winProbability * 100).toFixed(1)}%
                  </span>
                </span>
              ))}
            </div>
          )}
          {!expanded && !isLoading && topThree.length === 0 && (
            <p className="text-[11px] text-muted-foreground mt-0.5">Tap to browse all 48 teams</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && (
        <CardContent className="p-0">
          <div className="px-4 py-3 space-y-3 border-b border-border/20 bg-secondary/10">
            <p className="text-xs text-muted-foreground">
              Search or sort 48 teams by win probability
              {data ? ` · ${data.simulationsRun.toLocaleString()} sims` : ""}.
            </p>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search team or group…"
                className="pl-9 pr-9 h-9 bg-background/80"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="relative -mx-1">
              <div className="flex gap-1.5 overflow-x-auto pb-1 px-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-border">
                {(
                  [
                    { key: "rank" as const, label: "Win %" },
                    ...STAGES.slice(0, 5).map((s) => ({ key: s.key, label: s.label })),
                  ] as { key: SortKey; label: string }[]
                ).map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSortBy(s.key)}
                    className={cn(
                      "snap-start shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors",
                      sortBy === s.key
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground bg-background/60",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <LoadingAnimation message="Loading rankings" />
          ) : isError ? (
            <QueryErrorState
              title="Could not load rankings"
              onRetry={() => refetch()}
            />
          ) : sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10 px-4">
              No teams match &ldquo;{search}&rdquo;
            </p>
          ) : (
            <div
              className="max-h-[min(22rem,45vh)] overflow-y-auto overscroll-contain divide-y divide-border/15"
              role="list"
            >
              {sorted.map((entry) => {
                const isTop3 = entry.rank <= 3;
                const Row = onTeamSelect ? "button" : "div";
                return (
                  <Row
                    key={entry.team.id}
                    type={onTeamSelect ? "button" : undefined}
                    role="listitem"
                    onClick={onTeamSelect ? () => handleTeamClick(entry.team.id) : undefined}
                    className={cn(
                      "w-full text-left flex items-center gap-2.5 px-4 py-2.5 group hover:bg-secondary/30 transition-colors",
                      isTop3 && "bg-primary/[0.03]",
                      onTeamSelect && "cursor-pointer",
                    )}
                  >
                    <div className="w-5 flex justify-center">{rankMedal(entry.rank)}</div>
                    <TeamFlag flagCode={entry.team.flagCode} size={22} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "text-sm font-semibold truncate leading-tight",
                          isTop3 && "text-primary",
                          onTeamSelect && "group-hover:text-primary",
                        )}
                      >
                        {entry.team.name}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground">
                        Grp {entry.team.group}
                        {sortBy !== "rank" && sortBy !== "winProbability" && (
                          <span className="ml-2">
                            {STAGES.find((s) => s.key === sortBy)?.label}{" "}
                            {(((entry[sortBy as StageKey] as number) ?? 0) * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-1">
                      <span className={cn("text-sm font-bold font-mono tabular-nums", winColor(entry.winProbability))}>
                        {(entry.winProbability * 100).toFixed(1)}%
                      </span>
                      <div className="mt-1 h-1 w-14 bg-secondary rounded-full overflow-hidden ml-auto">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.max(4, entry.winProbability * 100 * 5)}%` }}
                        />
                      </div>
                    </div>
                    {onTeamSelect && (
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    )}
                  </Row>
                );
              })}
            </div>
          )}

          {data && (
            <p className="text-center text-[10px] font-mono text-muted-foreground py-2.5 border-t border-border/20 bg-secondary/5">
              <Activity className="inline w-3 h-3 mr-1 text-primary" />
              {sorted.length} shown · {data.simulationsRun.toLocaleString()} simulations
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
