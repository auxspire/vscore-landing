import { useMemo } from "react";
import { Trophy, RefreshCw } from "lucide-react";
import { TeamFlag } from "@/components/TeamFlag";
import { FixturesLoadingState } from "@/components/FixturesLoadingState";
import { SyncStatusFooter } from "@/components/SyncStatusFooter";
import { useFootballSyncJobs } from "@/hooks/useFootballData";
import { useKnockoutBracket } from "@/hooks/useKnockoutBracket";
import {
  matchesByStage,
  stageDisplayLabel,
  type BracketMatch,
  type BracketParticipant,
  type KnockoutStage,
} from "@/lib/knockout-bracket-state";
import { formatKickoffDateTime } from "@/lib/match-datetime";
import { cn } from "@/lib/utils";

function BracketTeamRow({
  participant,
  score,
  isWinner,
  dimmed,
}: {
  participant: BracketParticipant;
  score: number | null;
  isWinner?: boolean;
  dimmed?: boolean;
}) {
  const isPlaceholder = !participant.apiTeamId;

  return (
    <div
      className={cn(
        "flex items-center gap-2 min-h-[2.25rem] rounded-full px-2.5 py-1.5 transition-all",
        isPlaceholder
          ? "bg-secondary/40 border border-dashed border-border/60"
          : "bg-gradient-to-r from-primary/25 via-primary/40 to-primary/55 border border-primary/20",
        dimmed && "opacity-45",
        isWinner && !isPlaceholder && "ring-2 ring-primary/60 shadow-[0_0_12px_-2px_hsl(var(--primary))]",
      )}
    >
      <TeamFlag
        flagCode={participant.fifaCode ?? ""}
        flagUrl={participant.flagUrl}
        size={22}
        className={cn(isPlaceholder && "opacity-30")}
      />
      <span
        className={cn(
          "flex-1 text-xs sm:text-sm font-bold uppercase tracking-wide truncate",
          isPlaceholder ? "text-muted-foreground font-medium normal-case" : "text-foreground",
        )}
      >
        {participant.name}
      </span>
      <span
        className={cn(
          "w-7 h-7 shrink-0 flex items-center justify-center rounded-md border text-xs font-mono font-bold tabular-nums",
          score != null
            ? "border-primary/40 bg-background/80 text-foreground"
            : "border-border/50 bg-background/40 text-muted-foreground",
        )}
      >
        {score ?? "–"}
      </span>
    </div>
  );
}

function BracketMatchCard({ match }: { match: BracketMatch }) {
  const winnerId = match.winnerId;
  const dateLabel = match.kickoffAt ? formatKickoffDateTime(match.kickoffAt) : null;

  return (
    <article
      className={cn(
        "rounded-xl border bg-card/60 backdrop-blur-sm p-2.5 space-y-1.5 min-w-[11.5rem] sm:min-w-[13rem]",
        match.isLive
          ? "border-primary/50 shadow-[0_0_20px_-8px_hsl(var(--primary))]"
          : "border-border/70",
      )}
    >
      {dateLabel && (
        <p className="text-[10px] font-mono text-primary/80 uppercase tracking-wider truncate px-0.5">
          {dateLabel}
        </p>
      )}
      <BracketTeamRow
        participant={match.home.participant}
        score={match.home.score}
        isWinner={!!winnerId && winnerId === match.home.participant.apiTeamId}
        dimmed={!!winnerId && winnerId !== match.home.participant.apiTeamId}
      />
      <BracketTeamRow
        participant={match.away.participant}
        score={match.away.score}
        isWinner={!!winnerId && winnerId === match.away.participant.apiTeamId}
        dimmed={!!winnerId && winnerId !== match.away.participant.apiTeamId}
      />
      {match.isLive && (
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest text-center">Live</p>
      )}
    </article>
  );
}

function BracketRoundColumn({
  stage,
  matches,
}: {
  stage: KnockoutStage;
  matches: BracketMatch[];
}) {
  if (matches.length === 0) return null;

  return (
    <div className="flex flex-col shrink-0">
      <h3 className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1 sticky top-0 bg-background/90 backdrop-blur py-1 z-10">
        {stageDisplayLabel(stage)}
      </h3>
      <div
        className="flex flex-col justify-around flex-1 gap-3"
        style={{ minHeight: matches.length > 4 ? `${matches.length * 4.5}rem` : undefined }}
      >
        {matches.map((m) => (
          <BracketMatchCard key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}

const DISPLAY_STAGES: KnockoutStage[] = [
  "round_of_32",
  "round_of_16",
  "quarterfinal",
  "semifinal",
  "final",
];

export function KnockoutBracketPanel() {
  const { bracket, isLoading, isFetching } = useKnockoutBracket();
  const { data: syncJobs = [] } = useFootballSyncJobs();

  const byStage = useMemo(
    () => (bracket ? matchesByStage(bracket) : null),
    [bracket],
  );

  if (isLoading) {
    return <FixturesLoadingState compact={false} delayed={false} />;
  }

  if (!bracket || !byStage) {
    return (
      <div className="rounded-2xl border border-border bg-card/40 p-8 text-center text-muted-foreground">
        Bracket data is not available yet. Check back after group standings are published.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">Knockout stage</p>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            <span className="text-muted-foreground">FIFA </span>
            <span className="text-primary">World Cup &apos;26</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Bracket paths update from live group standings and knockout results.
            {!bracket.groupsComplete && " Some slots show projected positions until all groups finish."}
          </p>
        </div>
        {isFetching && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
            Updating…
          </div>
        )}
      </div>

      <div className="relative rounded-2xl border border-border/80 bg-card/30 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.06),transparent_70%)] pointer-events-none" />

        <div className="overflow-x-auto p-4 sm:p-6">
          <div className="flex gap-4 sm:gap-6 lg:gap-8 min-w-max items-stretch">
            {DISPLAY_STAGES.map((stage, i) => (
              <div key={stage} className="flex items-stretch gap-4 sm:gap-6 lg:gap-8">
                <BracketRoundColumn stage={stage} matches={byStage.get(stage) ?? []} />
                {i < DISPLAY_STAGES.length - 1 && (
                  <div className="hidden sm:flex flex-col justify-center w-4 shrink-0" aria-hidden>
                    <div className="h-px w-full bg-primary/30" />
                  </div>
                )}
              </div>
            ))}

            <div className="flex flex-col justify-center items-center shrink-0 pl-2 min-w-[8rem]">
              <Trophy className="w-8 h-8 text-primary mb-2" />
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary mb-2">
                Champion
              </p>
              {bracket.champion ? (
                <div className="flex flex-col items-center gap-2 text-center">
                  <TeamFlag
                    flagCode={bracket.champion.fifaCode ?? ""}
                    flagUrl={bracket.champion.flagUrl}
                    size={40}
                  />
                  <span className="text-sm font-bold">{bracket.champion.name}</span>
                </div>
              ) : (
                <div className="w-full h-10 rounded-lg border border-dashed border-border bg-secondary/30" />
              )}
            </div>
          </div>
        </div>
      </div>

      {(byStage.get("third_place")?.length ?? 0) > 0 && (
        <div className="max-w-xs">
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Third place
          </h3>
          <BracketMatchCard match={byStage.get("third_place")![0]} />
        </div>
      )}

      <SyncStatusFooter jobs={syncJobs} />
    </div>
  );
}
