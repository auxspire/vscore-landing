import { useState } from "react";
import { useGetTournamentRankings, getGetTournamentRankingsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { getFlagEmoji, cn } from "@/lib/utils";
import { useLiveMetrics } from "@/hooks/useLiveMetrics";
import { simulationCount } from "@/lib/simulation-config";
import { Trophy, Medal, Activity, ChevronRight } from "lucide-react";

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
  if (rank === 1) return <Trophy className="w-4 h-4 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-slate-300" />;
  if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
  return <span className="text-xs font-mono text-muted-foreground w-4 text-center">{rank}</span>;
}

function winColor(prob: number) {
  if (prob >= 0.12) return "text-primary";
  if (prob >= 0.06) return "text-amber-400";
  if (prob >= 0.03) return "text-orange-400";
  return "text-muted-foreground";
}

function stageBarColor(key: StageKey) {
  if (key === "winProbability") return "bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]";
  if (key === "finalProbability") return "bg-amber-400";
  if (key === "semifinalProbability") return "bg-orange-400";
  return "bg-secondary-foreground/50";
}

interface PowerRankingsPanelProps {
  /** Switch to bracket explorer for this team */
  onTeamSelect?: (teamId: string) => void;
}

export function PowerRankingsPanel({ onTeamSelect }: PowerRankingsPanelProps) {
  const [sortBy, setSortBy] = useState<SortKey>("rank");
  const { queryFlag } = useLiveMetrics();
  const rankParams = { simulations: simulationCount(!!queryFlag), useLiveMetrics: queryFlag };

  const { data, isLoading } = useGetTournamentRankings(rankParams, {
    query: { staleTime: 5 * 60 * 1000, queryKey: getGetTournamentRankingsQueryKey(rankParams) },
  });

  const sorted = data?.rankings
    ? sortBy === "rank"
      ? [...data.rankings]
      : [...data.rankings].sort((a, b) => {
          const aVal = a[sortBy as StageKey] ?? 0;
          const bVal = b[sortBy as StageKey] ?? 0;
          return (bVal as number) - (aVal as number);
        })
    : [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        All 48 teams ranked by championship win probability
        {data ? ` · ${data.simulationsRun.toLocaleString()} simulations` : ""}.
        {onTeamSelect && " Tap a team to open its bracket path."}
      </p>

      <div className="flex flex-wrap gap-2">
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
              "px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors",
              sortBy === s.key
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <Card className="bg-card border-border shadow-lg overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-border/50 bg-secondary/20 hidden sm:grid grid-cols-[2rem,1fr,6rem,repeat(5,3.5rem)] gap-2 items-center">
          <span className="text-xs font-mono text-muted-foreground">#</span>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Team</span>
          <span className="text-xs font-bold uppercase tracking-wider text-primary text-right">Win %</span>
          {STAGES.slice(0, 5).map((s) => (
            <span key={s.key} className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
              {s.short}
            </span>
          ))}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingAnimation message="Loading rankings" />
          ) : (
            <div className="divide-y divide-border/20">
              {sorted.map((entry) => {
                const isTop3 = entry.rank <= 3;
                const TeamRow = onTeamSelect ? "button" : "div";
                return (
                  <TeamRow
                    key={entry.team.id}
                    type={onTeamSelect ? "button" : undefined}
                    onClick={onTeamSelect ? () => onTeamSelect(entry.team.id) : undefined}
                    className={cn(
                      "w-full text-left grid grid-cols-[2rem,1fr,6rem] sm:grid-cols-[2rem,1fr,6rem,repeat(5,3.5rem)] gap-2 items-center px-4 py-3 group hover:bg-secondary/30 transition-colors",
                      isTop3 && "bg-primary/[0.04]",
                      onTeamSelect && "cursor-pointer",
                    )}
                  >
                    <div className="flex items-center justify-center">{rankMedal(entry.rank)}</div>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl leading-none flex-shrink-0">
                        {getFlagEmoji(entry.team.flagCode)}
                      </span>
                      <div className="min-w-0">
                        <div
                          className={cn(
                            "text-sm font-semibold leading-tight truncate",
                            isTop3 && "text-primary",
                            onTeamSelect && "group-hover:text-primary",
                          )}
                        >
                          {entry.team.name}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground tracking-wider">
                          Group {entry.team.group}
                        </div>
                      </div>
                      {onTeamSelect && (
                        <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-right">
                      <span className={cn("text-base font-bold font-mono", winColor(entry.winProbability))}>
                        {(entry.winProbability * 100).toFixed(1)}
                        <span className="text-xs text-muted-foreground">%</span>
                      </span>
                      <div className="mt-1 h-1 w-full bg-secondary rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.max(1, entry.winProbability * 100 * 5)}%` }}
                        />
                      </div>
                    </div>
                    {STAGES.slice(0, 5).map((s) => {
                      const val = entry[s.key as StageKey] as number;
                      return (
                        <div key={s.key} className="text-right hidden sm:block">
                          <span className="text-xs font-mono text-muted-foreground">
                            {(val * 100).toFixed(0)}%
                          </span>
                          <div className="mt-1 h-1 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full", stageBarColor(s.key))}
                              style={{ width: `${Math.max(1, val * 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </TeamRow>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {data && (
        <p className="text-center text-xs font-mono text-muted-foreground">
          <Activity className="inline w-3 h-3 mr-1 text-primary" />
          {data.simulationsRun.toLocaleString()} simulations · probabilities vary slightly on each load
        </p>
      )}
    </div>
  );
}
