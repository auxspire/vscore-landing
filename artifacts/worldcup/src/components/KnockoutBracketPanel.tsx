import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Trophy, RefreshCw } from "lucide-react";
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
  type KnockoutBracketState,
  type KnockoutStage,
} from "@/lib/knockout-bracket-state";
import { formatKickoffDateTime } from "@/lib/match-datetime";
import { cn } from "@/lib/utils";

const DISPLAY_STAGES: KnockoutStage[] = [
  "round_of_32",
  "round_of_16",
  "quarterfinal",
  "semifinal",
  "final",
];

type MobileView = KnockoutStage | "champion" | "third_place";

const MOBILE_STAGE_TABS: { id: MobileView; short: string; label: string }[] = [
  { id: "round_of_32", short: "R32", label: "Round of 32" },
  { id: "round_of_16", short: "R16", label: "Round of 16" },
  { id: "quarterfinal", short: "QF", label: "Quarter-finals" },
  { id: "semifinal", short: "SF", label: "Semi-finals" },
  { id: "final", short: "Final", label: "Final" },
  { id: "champion", short: "🏆", label: "Champion" },
];

function pickDefaultMobileStage(
  byStage: Map<KnockoutStage, BracketMatch[]>,
  hasThirdPlace: boolean,
): MobileView {
  for (const stage of DISPLAY_STAGES) {
    const matches = byStage.get(stage) ?? [];
    if (matches.some((m) => m.isLive)) return stage;
  }
  for (const stage of DISPLAY_STAGES) {
    const matches = byStage.get(stage) ?? [];
    if (
      matches.some(
        (m) =>
          !m.isFinished &&
          m.home.participant.apiTeamId &&
          m.away.participant.apiTeamId,
      )
    ) {
      return stage;
    }
  }
  for (let i = DISPLAY_STAGES.length - 1; i >= 0; i--) {
    const stage = DISPLAY_STAGES[i];
    if ((byStage.get(stage) ?? []).some((m) => m.isFinished)) return stage;
  }
  if (hasThirdPlace) return "third_place";
  return "round_of_32";
}

function BracketTeamRow({
  participant,
  score,
  isWinner,
  dimmed,
  compact,
}: {
  participant: BracketParticipant;
  score: number | null;
  isWinner?: boolean;
  dimmed?: boolean;
  compact?: boolean;
}) {
  const isPlaceholder = !participant.apiTeamId;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full transition-all",
        compact ? "min-h-[2.75rem] px-3 py-2" : "min-h-[2.25rem] px-2.5 py-1.5",
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
        size={compact ? 24 : 22}
        className={cn(isPlaceholder && "opacity-30")}
      />
      <span
        className={cn(
          "flex-1 min-w-0 font-bold tracking-wide",
          compact ? "text-sm leading-snug" : "text-xs sm:text-sm uppercase truncate",
          isPlaceholder
            ? "text-muted-foreground font-medium normal-case line-clamp-2"
            : "text-foreground truncate",
        )}
      >
        {participant.name}
      </span>
      <span
        className={cn(
          "shrink-0 flex items-center justify-center rounded-md border font-mono font-bold tabular-nums",
          compact ? "w-8 h-8 text-sm" : "w-7 h-7 text-xs",
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

function BracketMatchCard({
  match,
  compact,
}: {
  match: BracketMatch;
  compact?: boolean;
}) {
  const winnerId = match.winnerId;
  const dateLabel = match.kickoffAt ? formatKickoffDateTime(match.kickoffAt) : null;

  return (
    <article
      className={cn(
        "rounded-xl border bg-card/60 backdrop-blur-sm space-y-2",
        compact ? "w-full p-3.5" : "p-2.5 space-y-1.5 min-w-[11.5rem] sm:min-w-[13rem]",
        match.isLive
          ? "border-primary/50 shadow-[0_0_20px_-8px_hsl(var(--primary))]"
          : "border-border/70",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-0.5">
        {match.label && (
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider truncate">
            {match.label}
          </p>
        )}
        {match.isLive && (
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest shrink-0">
            Live
          </span>
        )}
      </div>
      {dateLabel && (
        <p className="text-[10px] font-mono text-primary/80 uppercase tracking-wider truncate px-0.5 -mt-1">
          {dateLabel}
        </p>
      )}
      <BracketTeamRow
        participant={match.home.participant}
        score={match.home.score}
        isWinner={!!winnerId && winnerId === match.home.participant.apiTeamId}
        dimmed={!!winnerId && winnerId !== match.home.participant.apiTeamId}
        compact={compact}
      />
      <BracketTeamRow
        participant={match.away.participant}
        score={match.away.score}
        isWinner={!!winnerId && winnerId === match.away.participant.apiTeamId}
        dimmed={!!winnerId && winnerId !== match.away.participant.apiTeamId}
        compact={compact}
      />
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
      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1 sticky top-0 bg-background/90 backdrop-blur py-1 z-10">
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

function ChampionBlock({ champion }: { champion: BracketParticipant | null }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-6 px-4">
      <Trophy className="w-10 h-10 text-primary mb-3" />
      <p className="text-xs font-mono font-bold uppercase tracking-widest text-primary mb-3">
        Champion
      </p>
      {champion ? (
        <div className="flex flex-col items-center gap-3">
          <TeamFlag flagCode={champion.fifaCode ?? ""} flagUrl={champion.flagUrl} size={48} />
          <span className="text-lg font-bold">{champion.name}</span>
        </div>
      ) : (
        <div className="w-full max-w-[12rem] h-12 rounded-xl border border-dashed border-border bg-secondary/30" />
      )}
    </div>
  );
}

function MobileBracketView({
  byStage,
  bracket,
}: {
  byStage: Map<KnockoutStage, BracketMatch[]>;
  bracket: KnockoutBracketState;
}) {
  const hasThirdPlace = (byStage.get("third_place")?.length ?? 0) > 0;
  const defaultStage = useMemo(
    () => pickDefaultMobileStage(byStage, hasThirdPlace),
    [byStage, hasThirdPlace],
  );
  const [active, setActive] = useState<MobileView>(defaultStage);

  const tabs = useMemo(() => {
    const base = [...MOBILE_STAGE_TABS];
    if (hasThirdPlace) {
      base.splice(base.length - 1, 0, {
        id: "third_place",
        short: "3rd",
        label: "Third place",
      });
    }
    return base;
  }, [hasThirdPlace]);

  const tabIndex = tabs.findIndex((t) => t.id === active);

  const goPrev = () => {
    if (tabIndex > 0) setActive(tabs[tabIndex - 1].id);
  };
  const goNext = () => {
    if (tabIndex < tabs.length - 1) setActive(tabs[tabIndex + 1].id);
  };

  const activeMatches =
    active !== "champion" && active !== "third_place"
      ? (byStage.get(active) ?? [])
      : [];

  const liveCount = activeMatches.filter((m) => m.isLive).length;
  const finishedCount = activeMatches.filter((m) => m.isFinished).length;

  return (
    <div className="md:hidden space-y-4">
      {/* Stage pills — horizontal scroll */}
      <div className="relative -mx-1">
        <div className="flex gap-1.5 overflow-x-auto pb-1 px-1 snap-x snap-mandatory scrollbar-none">
          {tabs.map((tab) => {
            const isActive = active === tab.id;
            const count =
              tab.id === "champion"
                ? bracket.champion
                  ? 1
                  : 0
                : tab.id === "third_place"
                  ? 1
                  : (byStage.get(tab.id)?.length ?? 0);
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                className={cn(
                  "snap-start shrink-0 flex flex-col items-center min-w-[3.25rem] px-3 py-2 rounded-xl border text-center transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-secondary/50 border-border/60 text-muted-foreground",
                )}
              >
                <span className="text-sm font-bold">{tab.short}</span>
                {tab.id !== "champion" && (
                  <span className={cn("text-[9px] font-mono tabular-nums", isActive ? "opacity-80" : "opacity-60")}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stage title + prev/next */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={goPrev}
          disabled={tabIndex <= 0}
          className="p-2 rounded-lg border border-border/60 disabled:opacity-30"
          aria-label="Previous round"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center min-w-0">
          <h3 className="text-sm font-bold truncate">
            {tabs.find((t) => t.id === active)?.label}
          </h3>
          {active !== "champion" && active !== "third_place" && activeMatches.length > 0 && (
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
              {finishedCount} played
              {liveCount > 0 && ` · ${liveCount} live`}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={goNext}
          disabled={tabIndex >= tabs.length - 1}
          className="p-2 rounded-lg border border-border/60 disabled:opacity-30"
          aria-label="Next round"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Match list */}
      <div className="space-y-3">
        {active === "champion" && <ChampionBlock champion={bracket.champion} />}
        {active === "third_place" && byStage.get("third_place")?.[0] && (
          <BracketMatchCard match={byStage.get("third_place")![0]} compact />
        )}
        {active !== "champion" && active !== "third_place" &&
          activeMatches.map((m) => (
            <BracketMatchCard key={m.id} match={m} compact />
          ))}
      </div>

      <p className="text-[10px] text-center text-muted-foreground font-mono">
        Swipe rounds with arrows · wider view on tablet+
      </p>
    </div>
  );
}

function DesktopBracketView({
  byStage,
  bracket,
}: {
  byStage: Map<KnockoutStage, BracketMatch[]>;
  bracket: KnockoutBracketState;
}) {
  return (
    <div className="hidden md:block relative rounded-2xl border border-border/80 bg-card/30 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.06),transparent_70%)] pointer-events-none" />
      <div className="overflow-x-auto p-4 sm:p-6">
        <div className="flex gap-4 sm:gap-6 lg:gap-8 min-w-max items-stretch">
          {DISPLAY_STAGES.map((stage, i) => (
            <div key={stage} className="flex items-stretch gap-4 sm:gap-6 lg:gap-8">
              <BracketRoundColumn stage={stage} matches={byStage.get(stage) ?? []} />
              {i < DISPLAY_STAGES.length - 1 && (
                <div className="flex flex-col justify-center w-4 shrink-0" aria-hidden>
                  <div className="h-px w-full bg-primary/30" />
                </div>
              )}
            </div>
          ))}
          <div className="flex flex-col justify-center items-center shrink-0 pl-2 min-w-[8rem]">
            <ChampionBlock champion={bracket.champion} />
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">Knockout stage</p>
          <h2 className="text-lg sm:text-2xl font-bold tracking-tight">
            <span className="text-muted-foreground">FIFA </span>
            <span className="text-primary">World Cup &apos;26</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
            Live standings and results.
            {!bracket.groupsComplete && " Some slots are projected until groups finish."}
          </p>
        </div>
        {isFetching && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
            Updating…
          </div>
        )}
      </div>

      <MobileBracketView byStage={byStage} bracket={bracket} />
      <DesktopBracketView byStage={byStage} bracket={bracket} />

      {(byStage.get("third_place")?.length ?? 0) > 0 && (
        <div className="hidden md:block max-w-sm">
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
