import { useCallback, useEffect, useMemo, useState, Fragment } from "react";
import { useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Trophy, RefreshCw } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { TeamFlag } from "@/components/TeamFlag";
import { FixturesLoadingState } from "@/components/FixturesLoadingState";
import { QueryErrorState } from "@/components/QueryErrorState";
import { SyncStatusFooter } from "@/components/SyncStatusFooter";
import { useFootballSyncJobs } from "@/hooks/useFootballData";
import { useKnockoutBracket } from "@/hooks/useKnockoutBracket";
import {
  matchesByStage,
  stageDisplayLabel,
  findTeamBracketFocus,
  type BracketFocusView,
  type BracketMatch,
  type BracketParticipant,
  type KnockoutBracketState,
  type KnockoutStage,
} from "@/lib/knockout-bracket-state";
import { formatBracketMatchSubtext } from "@/lib/match-datetime";
import { cn } from "@/lib/utils";

const DISPLAY_STAGES: KnockoutStage[] = [
  "round_of_32",
  "round_of_16",
  "quarterfinal",
  "semifinal",
  "final",
];

type MobileView = KnockoutStage | "champion" | "third_place" | "snapshot" | "overview";

const MOBILE_SLIDES: { id: MobileView; short: string; label: string }[] = [
  { id: "overview", short: "All", label: "Tournament overview" },
  { id: "snapshot", short: "Now", label: "Live & recent" },
  { id: "round_of_32", short: "R32", label: "Round of 32" },
  { id: "round_of_16", short: "R16", label: "Round of 16" },
  { id: "quarterfinal", short: "QF", label: "Quarter-finals" },
  { id: "semifinal", short: "SF", label: "Semi-finals" },
  { id: "final", short: "Final", label: "Final" },
  { id: "champion", short: "🏆", label: "Champion" },
];

function pickDefaultMobileSlide(
  byStage: Map<KnockoutStage, BracketMatch[]>,
  hasThirdPlace: boolean,
): MobileView {
  for (const stage of DISPLAY_STAGES) {
    if ((byStage.get(stage) ?? []).some((m) => m.isLive)) return stage;
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
  return "snapshot";
}

function stageStats(matches: BracketMatch[]) {
  return {
    live: matches.filter((m) => m.isLive).length,
    finished: matches.filter((m) => m.isFinished).length,
    total: matches.length,
  };
}

function MatchTimingSubtext({ match }: { match: BracketMatch }) {
  if (match.isLive) return null;
  const text = formatBracketMatchSubtext(match.kickoffAt);
  if (!text) return null;
  return (
    <p className="text-[10px] text-muted-foreground/90 font-mono tabular-nums truncate leading-none">
      {text}
    </p>
  );
}

function PlaceholderTeamName({ name, compact }: { name: string; compact?: boolean }) {
  const m = name.match(/^(Winner of|Loser of)\s+(\(.+\))$/i);
  if (m) {
    return (
      <span className="flex flex-col min-w-0 leading-snug gap-0.5">
        <span className="text-[10px] text-muted-foreground/80 font-medium">{m[1]}</span>
        <span className={cn("line-clamp-2 tabular-nums", compact ? "text-xs" : "text-sm")}>
          {m[2]}
        </span>
      </span>
    );
  }
  const plain = name.match(/^(Winner of|Loser of)\s+(.+)$/i);
  if (plain) {
    return (
      <span className="flex flex-col min-w-0 leading-snug gap-0.5">
        <span className="text-[10px] text-muted-foreground/80 font-medium">{plain[1]}</span>
        <span className={cn("line-clamp-2", compact ? "text-xs" : "text-sm")}>{plain[2]}</span>
      </span>
    );
  }
  return (
    <span className={cn("line-clamp-2", compact ? "text-xs" : "text-sm")}>{name}</span>
  );
}

function FeederPlaceholderName({
  participant,
  compact,
}: {
  participant: BracketParticipant;
  compact?: boolean;
}) {
  const sides = participant.feederTeams;
  if (!sides || sides.length < 2) {
    return <PlaceholderTeamName name={participant.name} compact={compact} />;
  }

  const flagSize = compact ? 16 : 18;

  return (
    <span className="flex flex-col min-w-0 leading-snug gap-0.5 flex-1">
      <span className="text-[10px] text-muted-foreground/80 font-medium">Winner of</span>
      <span className="flex items-center gap-0.5 min-w-0 flex-wrap">
        {sides.map((t, i) => (
          <Fragment key={`${t.name}-${i}`}>
            {i > 0 && (
              <span className="text-[9px] text-muted-foreground/50 px-0.5 shrink-0">vs</span>
            )}
            <span className="inline-flex items-center gap-1 min-w-0 max-w-[46%]">
              <TeamFlag
                flagCode={t.fifaCode ?? ""}
                flagUrl={t.flagUrl}
                size={flagSize}
                className={cn("shrink-0", !t.fifaCode && !t.flagUrl && "opacity-30")}
              />
              <span className={cn("truncate", compact ? "text-[11px]" : "text-xs")}>{t.name}</span>
            </span>
          </Fragment>
        ))}
      </span>
    </span>
  );
}

function ParticipantLabel({
  participant,
  compact,
}: {
  participant: BracketParticipant;
  compact?: boolean;
}) {
  if (participant.apiTeamId) return <>{participant.name}</>;
  if (participant.feederTeams?.length) {
    return <FeederPlaceholderName participant={participant} compact={compact} />;
  }
  return <PlaceholderTeamName name={participant.name} compact={compact} />;
}

function CompactMatchRow({
  match,
  highlightMatchId,
  highlightTeamId,
}: {
  match: BracketMatch;
  highlightMatchId?: string | null;
  highlightTeamId?: string | null;
}) {
  const winnerId = match.winnerId;
  const homeWin = !!winnerId && winnerId === match.home.participant.apiTeamId;
  const awayWin = !!winnerId && winnerId === match.away.participant.apiTeamId;
  const highlighted = highlightMatchId === match.id;

  return (
    <div
      data-bracket-match={match.id}
      className={cn(
        "rounded-xl border px-3 py-2.5 bg-card/70 space-y-1.5 transition-shadow",
        match.isLive ? "border-primary/50" : "border-border/60",
        highlighted && "ring-2 ring-primary/70 shadow-[0_0_16px_-4px_hsl(var(--primary))]",
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 min-w-0">
            <TeamFlag
              flagCode={match.home.participant.fifaCode ?? ""}
              flagUrl={match.home.participant.flagUrl}
              size={18}
              className={cn(!match.home.participant.apiTeamId && "opacity-30")}
            />
            <span
              className={cn(
                "flex-1 text-sm min-w-0",
                homeWin && "font-bold text-primary",
                awayWin && winnerId && "opacity-45",
                !match.home.participant.apiTeamId && "text-muted-foreground",
                match.home.participant.apiTeamId && "truncate",
                highlightTeamId === match.home.participant.apiTeamId &&
                  "text-primary font-bold",
              )}
            >
              {match.home.participant.apiTeamId ? (
                match.home.participant.name
              ) : (
                <ParticipantLabel participant={match.home.participant} compact />
              )}
            </span>
            <span className="font-mono font-bold tabular-nums text-sm w-5 text-right">
              {match.home.score ?? "–"}
            </span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <TeamFlag
              flagCode={match.away.participant.fifaCode ?? ""}
              flagUrl={match.away.participant.flagUrl}
              size={18}
              className={cn(!match.away.participant.apiTeamId && "opacity-30")}
            />
            <span
              className={cn(
                "flex-1 text-sm min-w-0",
                awayWin && "font-bold text-primary",
                homeWin && winnerId && "opacity-45",
                !match.away.participant.apiTeamId && "text-muted-foreground",
                match.away.participant.apiTeamId && "truncate",
                highlightTeamId === match.away.participant.apiTeamId &&
                  "text-primary font-bold",
              )}
            >
              {match.away.participant.apiTeamId ? (
                match.away.participant.name
              ) : (
                <ParticipantLabel participant={match.away.participant} compact />
              )}
            </span>
            <span className="font-mono font-bold tabular-nums text-sm w-5 text-right">
              {match.away.score ?? "–"}
            </span>
          </div>
        </div>
        {match.isLive && (
          <span className="shrink-0 text-[9px] font-bold uppercase text-primary tracking-wider">
            Live
          </span>
        )}
      </div>
      <MatchTimingSubtext match={match} />
    </div>
  );
}

function BracketTeamRow({
  participant,
  score,
  isWinner,
  dimmed,
  compact,
  highlighted,
}: {
  participant: BracketParticipant;
  score: number | null;
  isWinner?: boolean;
  dimmed?: boolean;
  compact?: boolean;
  highlighted?: boolean;
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
        highlighted && !isWinner && "ring-2 ring-primary/50",
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
          compact ? "text-sm leading-snug" : "text-xs sm:text-sm",
          isPlaceholder
            ? "text-muted-foreground font-medium normal-case"
            : "text-foreground uppercase truncate",
        )}
      >
        {isPlaceholder ? (
          <ParticipantLabel participant={participant} compact={compact} />
        ) : (
          participant.name
        )}
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
  highlightMatchId,
  highlightTeamId,
}: {
  match: BracketMatch;
  compact?: boolean;
  highlightMatchId?: string | null;
  highlightTeamId?: string | null;
}) {
  const winnerId = match.winnerId;
  const highlighted = highlightMatchId === match.id;

  return (
    <article
      data-bracket-match={match.id}
      className={cn(
        "rounded-xl border bg-card/60 backdrop-blur-sm space-y-2 transition-shadow",
        compact ? "w-full p-3.5" : "p-2.5 space-y-1.5 min-w-[11.5rem] sm:min-w-[13rem]",
        match.isLive
          ? "border-primary/50 shadow-[0_0_20px_-8px_hsl(var(--primary))]"
          : "border-border/70",
        highlighted && "ring-2 ring-primary/70 shadow-[0_0_16px_-4px_hsl(var(--primary))]",
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
      <BracketTeamRow
        participant={match.home.participant}
        score={match.home.score}
        isWinner={!!winnerId && winnerId === match.home.participant.apiTeamId}
        dimmed={!!winnerId && winnerId !== match.home.participant.apiTeamId}
        compact={compact}
        highlighted={highlightTeamId === match.home.participant.apiTeamId}
      />
      <BracketTeamRow
        participant={match.away.participant}
        score={match.away.score}
        isWinner={!!winnerId && winnerId === match.away.participant.apiTeamId}
        dimmed={!!winnerId && winnerId !== match.away.participant.apiTeamId}
        compact={compact}
        highlighted={highlightTeamId === match.away.participant.apiTeamId}
      />
      <div className="px-0.5">
        <MatchTimingSubtext match={match} />
      </div>
    </article>
  );
}

function BracketRoundColumn({
  stage,
  matches,
  highlightMatchId,
  highlightTeamId,
}: {
  stage: KnockoutStage;
  matches: BracketMatch[];
  highlightMatchId?: string | null;
  highlightTeamId?: string | null;
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
          <BracketMatchCard
            key={m.id}
            match={m}
            highlightMatchId={highlightMatchId}
            highlightTeamId={highlightTeamId}
          />
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

function BracketOverviewSlide({
  byStage,
  bracket,
  hasThirdPlace,
  onJumpToStage,
}: {
  byStage: Map<KnockoutStage, BracketMatch[]>;
  bracket: KnockoutBracketState;
  hasThirdPlace: boolean;
  onJumpToStage: (view: MobileView) => void;
}) {
  const rows: { id: MobileView; label: string }[] = [
    ...DISPLAY_STAGES.map((s) => ({ id: s as MobileView, label: stageDisplayLabel(s) })),
    ...(hasThirdPlace ? [{ id: "third_place" as MobileView, label: "Third place" }] : []),
    { id: "champion", label: "Champion" },
  ];

  return (
    <div className="space-y-1.5">
      {rows.map(({ id, label }) => {
        const matches = id === "champion" ? [] : (byStage.get(id as KnockoutStage) ?? []);
        const stats =
          id === "champion"
            ? { live: 0, finished: bracket.champion ? 1 : 0, total: 1 }
            : stageStats(matches);
        const preview =
          id === "champion"
            ? null
            : [
                ...matches.filter((m) => m.isLive),
                ...matches.filter((m) => !m.isFinished && !m.isLive),
                ...matches.filter((m) => m.isFinished),
              ].slice(0, 2);

        return (
          <button
            key={id}
            type="button"
            onClick={() => onJumpToStage(id)}
            className="w-full text-left rounded-xl border border-border/60 bg-card/50 px-3 py-2.5 hover:bg-secondary/40 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground shrink-0">
                {stats.live > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" aria-hidden />
                )}
                {id === "champion"
                  ? bracket.champion
                    ? bracket.champion.name
                    : "TBD"
                  : `${stats.finished}/${stats.total}`}
              </span>
            </div>
            {preview && preview.length > 0 && (
              <div className="flex flex-col gap-1">
                {preview.map((m) => (
                  <span key={m.id} className="text-[11px] text-muted-foreground truncate">
                    {m.home.participant.apiTeamId ? m.home.participant.name : "TBD"} vs{" "}
                    {m.away.participant.apiTeamId ? m.away.participant.name : "TBD"}
                    {m.isLive && <span className="text-primary font-bold ml-1">· Live</span>}
                  </span>
                ))}
              </div>
            )}
          </button>
        );
      })}
      <p className="text-[10px] text-center text-muted-foreground font-mono pt-2">
        Tap a round for details · swipe for live snapshot
      </p>
    </div>
  );
}

function MobileBracketView({
  byStage,
  bracket,
  highlightMatchId,
  highlightTeamId,
  focusSlide,
}: {
  byStage: Map<KnockoutStage, BracketMatch[]>;
  bracket: KnockoutBracketState;
  highlightMatchId?: string | null;
  highlightTeamId?: string | null;
  focusSlide?: BracketFocusView | "snapshot" | "overview";
}) {
  const hasThirdPlace = (byStage.get("third_place")?.length ?? 0) > 0;
  const defaultSlide = useMemo(
    () => focusSlide ?? pickDefaultMobileSlide(byStage, hasThirdPlace),
    [byStage, hasThirdPlace, focusSlide],
  );

  const allKnockoutMatches = useMemo(
    () => DISPLAY_STAGES.flatMap((stage) => byStage.get(stage) ?? []),
    [byStage],
  );

  const slides = useMemo(() => {
    const base = [...MOBILE_SLIDES];
    if (hasThirdPlace) {
      base.splice(base.length - 1, 0, {
        id: "third_place",
        short: "3rd",
        label: "Third place",
      });
    }
    return base;
  }, [hasThirdPlace]);

  const snapshotMatches = useMemo(() => {
    const all = DISPLAY_STAGES.flatMap((stage) => byStage.get(stage) ?? []);
    const live = all.filter((m) => m.isLive);
    const recent = all
      .filter((m) => m.isFinished)
      .sort((a, b) => (b.kickoffAt ?? "").localeCompare(a.kickoffAt ?? ""));
    return [...live, ...recent.filter((m) => !live.includes(m))].slice(0, 8);
  }, [byStage]);

  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, slides.findIndex((s) => s.id === defaultSlide)),
  );

  useEffect(() => {
    if (!carouselApi) return;
    const startIndex = Math.max(0, slides.findIndex((s) => s.id === defaultSlide));
    if (startIndex > 0) carouselApi.scrollTo(startIndex, true);
    const onSelect = () => setActiveIndex(carouselApi.selectedScrollSnap());
    onSelect();
    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi, defaultSlide, slides]);

  const scrollTo = useCallback(
    (index: number) => {
      carouselApi?.scrollTo(index);
    },
    [carouselApi],
  );

  const jumpToStage = useCallback(
    (view: MobileView) => {
      const idx = slides.findIndex((s) => s.id === view);
      if (idx >= 0) scrollTo(idx);
    },
    [slides, scrollTo],
  );

  return (
    <div className="md:hidden space-y-3">
      {/* Round glance strip — tap to jump, swipe carousel below */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none -mx-0.5 px-0.5">
        {slides.map((slide, index) => {
          const isActive = activeIndex === index;
          const matches =
            slide.id === "overview"
              ? allKnockoutMatches
              : slide.id === "snapshot"
              ? snapshotMatches
              : slide.id === "champion"
                ? []
                : slide.id === "third_place"
                  ? (byStage.get("third_place") ?? [])
                  : (byStage.get(slide.id) ?? []);
          const stats =
            slide.id === "overview"
              ? stageStats(allKnockoutMatches)
              : slide.id === "snapshot"
              ? {
                  live: snapshotMatches.filter((m) => m.isLive).length,
                  finished: snapshotMatches.filter((m) => m.isFinished).length,
                  total: snapshotMatches.length,
                }
              : slide.id === "champion"
                ? { live: 0, finished: bracket.champion ? 1 : 0, total: 1 }
                : stageStats(matches);

          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => scrollTo(index)}
              className={cn(
                "shrink-0 flex flex-col items-center min-w-[3.5rem] px-2.5 py-2 rounded-xl border transition-all",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]"
                  : "bg-secondary/40 border-border/50 text-muted-foreground",
              )}
            >
              <span className="text-xs font-bold">{slide.short}</span>
              {stats.live > 0 ? (
                <span
                  className={cn(
                    "mt-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse",
                    isActive && "bg-primary-foreground",
                  )}
                />
              ) : stats.total > 0 ? (
                <span className={cn("text-[9px] font-mono tabular-nums mt-0.5", isActive ? "opacity-90" : "opacity-60")}>
                  {stats.finished}/{stats.total}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <Carousel
        setApi={setCarouselApi}
        opts={{ align: "start", loop: false, dragFree: false }}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {slides.map((slide) => {
            const matches =
              slide.id === "overview"
                ? allKnockoutMatches
                : slide.id === "snapshot"
                ? snapshotMatches
                : slide.id === "third_place"
                  ? (byStage.get("third_place") ?? [])
                  : slide.id !== "champion"
                    ? (byStage.get(slide.id) ?? [])
                    : [];

            return (
              <CarouselItem key={slide.id} className="pl-2 basis-full">
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between gap-2 px-0.5">
                    <h3 className="text-base font-bold">{slide.label}</h3>
                    {slide.id !== "champion" &&
                      slide.id !== "snapshot" &&
                      slide.id !== "overview" &&
                      matches.length > 0 && (
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {stageStats(matches).finished}/{matches.length} played
                      </p>
                    )}
                    {slide.id === "overview" && (
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {stageStats(allKnockoutMatches).live > 0
                          ? `${stageStats(allKnockoutMatches).live} live`
                          : `${stageStats(allKnockoutMatches).finished}/${allKnockoutMatches.length} played`}
                      </p>
                    )}
                  </div>

                  {slide.id === "overview" ? (
                    <BracketOverviewSlide
                      byStage={byStage}
                      bracket={bracket}
                      hasThirdPlace={hasThirdPlace}
                      onJumpToStage={jumpToStage}
                    />
                  ) : slide.id === "champion" ? (
                    <ChampionBlock champion={bracket.champion} />
                  ) : matches.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {slide.id === "snapshot"
                        ? "No live or recent knockout matches yet."
                        : "No matches in this round yet."}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {matches.map((m) => (
                        <CompactMatchRow
                          key={m.id}
                          match={m}
                          highlightMatchId={highlightMatchId}
                          highlightTeamId={highlightTeamId}
                        />
                      ))}
                    </div>
                  )}

                  {slide.id === "snapshot" && (
                    <p className="text-[10px] text-center text-muted-foreground font-mono pt-1">
                      Swipe → for full round-by-round view
                    </p>
                  )}
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>

      {/* Dot pager */}
      <div className="flex justify-center gap-1.5 pt-1">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => scrollTo(index)}
            aria-label={slide.label}
            className={cn(
              "h-1.5 rounded-full transition-all",
              activeIndex === index ? "w-5 bg-primary" : "w-1.5 bg-border",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function DesktopBracketView({
  byStage,
  bracket,
  highlightMatchId,
  highlightTeamId,
}: {
  byStage: Map<KnockoutStage, BracketMatch[]>;
  bracket: KnockoutBracketState;
  highlightMatchId?: string | null;
  highlightTeamId?: string | null;
}) {
  return (
    <div className="hidden md:block relative rounded-2xl border border-border/80 bg-card/30 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.06),transparent_70%)] pointer-events-none" />
      <div className="overflow-x-auto p-4 sm:p-6">
        <div className="flex gap-4 sm:gap-6 lg:gap-8 min-w-max items-stretch">
          {DISPLAY_STAGES.map((stage, i) => (
            <div key={stage} className="flex items-stretch gap-4 sm:gap-6 lg:gap-8">
              <BracketRoundColumn
                stage={stage}
                matches={byStage.get(stage) ?? []}
                highlightMatchId={highlightMatchId}
                highlightTeamId={highlightTeamId}
              />
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
  const search = useSearch();
  const queryClient = useQueryClient();
  const { bracket, isLoading, isFetching, isError } = useKnockoutBracket();
  const { data: syncJobs = [] } = useFootballSyncJobs();

  const highlightTeamId = useMemo(() => {
    const qs = search.startsWith("?") ? search.slice(1) : search;
    return new URLSearchParams(qs).get("team");
  }, [search]);

  const byStage = useMemo(
    () => (bracket ? matchesByStage(bracket) : null),
    [bracket],
  );

  const teamFocus = useMemo(() => {
    if (!bracket || !highlightTeamId) return null;
    return findTeamBracketFocus(bracket, highlightTeamId);
  }, [bracket, highlightTeamId]);

  const highlightMatchId = teamFocus?.match.id ?? null;
  const focusSlide = teamFocus?.view ?? undefined;

  useEffect(() => {
    if (!highlightMatchId) return;
    const id = window.setTimeout(() => {
      document
        .querySelector(`[data-bracket-match="${highlightMatchId}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 400);
    return () => window.clearTimeout(id);
  }, [highlightMatchId, byStage]);

  const retryLive = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["football-live"] });
  }, [queryClient]);

  if (isLoading) {
    return <FixturesLoadingState compact={false} delayed={false} label="Loading bracket" />;
  }

  if (isError) {
    return (
      <QueryErrorState
        title="Could not load bracket"
        message="Live tournament data is unavailable right now. Check your connection and try again."
        onRetry={retryLive}
      />
    );
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
            {teamFocus && (
              <span className="block text-primary/90 mt-1">
                Showing bracket position for{" "}
                {teamFocus.match.home.participant.apiTeamId === highlightTeamId
                  ? teamFocus.match.home.participant.name
                  : teamFocus.match.away.participant.name}
              </span>
            )}
          </p>
        </div>
        {isFetching && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
            Updating…
          </div>
        )}
      </div>

      <MobileBracketView
        byStage={byStage}
        bracket={bracket}
        highlightMatchId={highlightMatchId}
        highlightTeamId={highlightTeamId}
        focusSlide={focusSlide}
      />
      <DesktopBracketView
        byStage={byStage}
        bracket={bracket}
        highlightMatchId={highlightMatchId}
        highlightTeamId={highlightTeamId}
      />

      {(byStage.get("third_place")?.length ?? 0) > 0 && (
        <div className="hidden md:block max-w-sm">
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Third place
          </h3>
          <BracketMatchCard
            match={byStage.get("third_place")![0]}
            highlightMatchId={highlightMatchId}
            highlightTeamId={highlightTeamId}
          />
        </div>
      )}

      <SyncStatusFooter jobs={syncJobs} />
    </div>
  );
}
