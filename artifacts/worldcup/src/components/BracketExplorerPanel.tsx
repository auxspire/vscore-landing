import { useMemo } from "react"
import { useGetBracketExplorer, getGetBracketExplorerQueryKey } from "@workspace/api-client-react"
import {
  buildLockedDisplayPath,
  buildMostLikelyDisplayPath,
  buildMostLikelyPathResult,
  formatOpponentSlotHints,
  inferFinishPosForOpponent,
  knockoutStageIndex,
  opponentSlotHintsForTeamFinish,
  resolveLockedOpponent,
  type GroupFinish,
} from "@workspace/bracket-path"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingAnimation } from "@/components/LoadingAnimation"
import { QueryErrorState } from "@/components/QueryErrorState"
import { TeamFlag } from "@/components/TeamFlag"
import { cn } from "@/lib/utils"
import { WORLDCUP_BASE } from "@/lib/seo"
import { SharePredictionButton } from "@/components/SharePredictionButton"
import { buildBracketShareMessage } from "@/lib/share-messages"
import { simulationCount } from "@/lib/simulation-config"
import { useLiveMetrics } from "@/hooks/useLiveMetrics"
import { useHomeTab } from "@/hooks/useHomeTab"
import { Trophy, Swords, GitBranch, ChevronRight, Shield, Flame, Zap, Lock, X } from "lucide-react"

// ─── Extended types for enriched API response ─────────────────────────────────

interface ConditionalStageNode {
  stage: string
  reachProbability: number
  /** How many simulations this conditional estimate is based on */
  sampleCount?: number
  topOpponents: Array<{
    team: RichTeam
    encounterProbability: number
    winProbabilityIfFacing: number
  }>
}

interface RichTeam {
  id: string
  name: string
  flagCode: string
  group: string
  fifaRanking: number
  eloRating: number
  confederation: string
}

interface RichOpponent {
  team: RichTeam
  encounterProbability: number
  winProbabilityIfFacing: number
  groupFinish: Record<string, number>
  /** Number of simulations this opponent entry is based on — low = treat as rough estimate */
  sampleCount?: number
  conditionalPath: ConditionalStageNode[]
}

interface RichStageNode {
  stage: string
  description: string
  reachProbability: number
  teamGroupFinish: Record<string, number>
  topOpponents: RichOpponent[]
  /** R32 only: opponents split by which team group-finish scenario leads to them */
  opponentsByFinish?: Record<string, RichOpponent[]>
  /** Set to true when data is from a conditional (locked-opponent) path */
  isConditional?: boolean
  /** Opponents from overall sims when conditional/path-filter data was unavailable */
  opponentsFromAggregate?: boolean
  /** Auto R32-anchor projection vs explicit user lock */
  pathProjection?: "projected" | "user_locked"
  /** Number of simulations this conditional stage estimate is based on — low = unreliable */
  sampleCount?: number
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function topKey(map: Record<string, number>): string | null {
  const entries = Object.entries(map)
  if (!entries.length) return null
  return entries.sort((a, b) => b[1] - a[1])[0][0]
}

function difficultyLabel(winRate: number): { label: string; color: string; icon: React.ReactNode } {
  if (winRate >= 0.65) return { label: "FAVORABLE", color: "text-primary",     icon: <Zap   className="w-3 h-3" /> }
  if (winRate >= 0.50) return { label: "EVEN",      color: "text-amber-400",   icon: <Swords className="w-3 h-3" /> }
  if (winRate >= 0.38) return { label: "DANGER",    color: "text-orange-400",  icon: <Flame  className="w-3 h-3" /> }
  return                      { label: "CRITICAL",  color: "text-destructive", icon: <Shield className="w-3 h-3" /> }
}

function winRateColor(wr: number) {
  if (wr >= 0.65) return "text-primary"
  if (wr >= 0.50) return "text-amber-400"
  if (wr >= 0.38) return "text-orange-400"
  return "text-destructive"
}

const SHORT_STAGE: Record<string, string> = {
  round_of_32: "R32",
  round_of_16: "R16",
  quarterfinal: "QF",
  semifinal:    "SF",
  final:        "Final",
}

// ─── GroupFinishBadge ─────────────────────────────────────────────────────────

function GroupFinishBadge({ finishMap, group, side }: {
  finishMap: Record<string, number>
  group: string
  side: "team" | "opponent"
}) {
  const top = topKey(finishMap)
  if (!top) return null
  const pct = Math.round((finishMap[top] ?? 0) * 100)
  return (
    <div className={cn(
      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider",
      side === "team"
        ? "bg-primary/10 text-primary border border-primary/20"
        : "bg-secondary/60 text-muted-foreground border border-border/50"
    )}>
      <span>Grp {group}</span>
      <span className="opacity-50">·</span>
      <span>{top}</span>
      {pct < 95 && <span className="opacity-60">({pct}%)</span>}
    </div>
  )
}

// ─── PathStrip ────────────────────────────────────────────────────────────────

function PathStrip({
  team,
  path,
  winProb,
  lockedStage,
}: {
  team: RichTeam
  path: RichStageNode[]
  winProb: number
  lockedStage: string | null
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
      <div className="flex-shrink-0 flex flex-col items-center gap-1 bg-primary/10 border border-primary/30 rounded-xl px-3 py-2.5 min-w-[60px] text-center">
        <TeamFlag flagCode={team.flagCode} size={28} />
        <span className="text-[10px] font-mono font-bold text-primary">GRP {team.group}</span>
      </div>

      {path.map((stage) => {
        const opp = stage.topOpponents[0]
        const isLocked = stage.stage === lockedStage
        const isConditional = stage.isConditional
        return (
          <div key={stage.stage} className="flex items-center gap-1">
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
            <div className={cn(
              "flex-shrink-0 flex flex-col items-center gap-1 rounded-xl px-3 py-2.5 min-w-[64px] text-center border transition-colors",
              stage.stage === "final"
                ? "bg-primary/15 border-primary/40"
                : isLocked
                  ? "bg-amber-500/10 border-amber-500/40"
                  : isConditional
                    ? "bg-secondary/70 border-primary/20"
                    : "bg-secondary/50 border-border hover:border-primary/30"
            )}>
              <span className="text-[10px] font-mono text-muted-foreground font-bold uppercase">
                {isLocked ? <Lock className="w-2.5 h-2.5 inline text-amber-400" /> : null}
                {SHORT_STAGE[stage.stage]}
              </span>
              <span className={cn("text-sm font-bold font-mono", stage.stage === "final" ? "text-primary" : "text-foreground")}>
                {(stage.reachProbability * 100).toFixed(0)}%
              </span>
              {opp && (
                <>
                  <TeamFlag flagCode={opp.team.flagCode} size={22} />
                  <span className="text-[9px] font-mono font-bold text-foreground/80 leading-tight max-w-[64px] truncate px-0.5">
                    {opp.team.name}
                  </span>
                </>
              )}
            </div>
          </div>
        )
      })}

      <div className="flex items-center gap-1">
        <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
        <div className="flex-shrink-0 flex flex-col items-center gap-1 bg-primary/20 border border-primary/50 rounded-xl px-3 py-2.5 min-w-[60px] text-center">
          <Trophy className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold font-mono text-primary">{(winProb * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}

// ─── StageCard ────────────────────────────────────────────────────────────────

function StageCard({
  stage,
  team,
  isLast,
  lockedOpponentId,
  lockedFinishPos,
  onLockOpponent,
  onViewTeam,
}: {
  stage: RichStageNode
  team: RichTeam
  isLast: boolean
  lockedOpponentId: string | null
  /** Which finish-position section the locked opponent was clicked from (R32 only) */
  lockedFinishPos: string | null
  onLockOpponent: (id: string | null, finishPos?: string | null) => void
  onViewTeam: (teamId: string) => void
}) {
  const isFinal       = stage.stage === "final"
  const isConditional = stage.isConditional === true
  const isProjected   = stage.pathProjection === "projected"
  const isUserLockedPath = stage.pathProjection === "user_locked"
  const isAggregateFallback = stage.opponentsFromAggregate === true
  const isR32         = stage.stage === "round_of_32"

  // All opponents across all finish groups (for lock lookup)
  const allFlatOpponents: RichOpponent[] = isR32 && stage.opponentsByFinish
    ? Object.values(stage.opponentsByFinish).flat()
    : stage.topOpponents

  // Primary = locked one. For R32, prefer the entry from the exact section that was clicked
  // (same team can appear in multiple finish sections with different groupFinish data)
  const primary = lockedOpponentId
    ? (() => {
        if (isR32 && lockedFinishPos && stage.opponentsByFinish?.[lockedFinishPos]) {
          const fromSection = stage.opponentsByFinish[lockedFinishPos].find(o => o.team.id === lockedOpponentId)
          if (fromSection) return fromSection
        }
        return allFlatOpponents.find(o => o.team.id === lockedOpponentId) ?? stage.topOpponents[0]
      })()
    : stage.topOpponents[0]

  // Non-R32 secondary (flat list for R16/QF/SF/Final)
  const secondary = stage.topOpponents.filter(o => o !== primary)
  const diff = primary ? difficultyLabel(primary.winProbabilityIfFacing) : null

  const POS_ORDER = ["1st", "2nd", "3rd"]

  // Team group finish map to display — pinned when a scenario is locked, otherwise aggregate
  const displayTeamGroupFinish: Record<string, number> = lockedFinishPos
    ? { [lockedFinishPos]: 1 }
    : stage.teamGroupFinish

  const teamTopFinish = topKey(displayTeamGroupFinish)

  function finishLabel(pos: string): string {
    if (pos === "1st") return `As Group ${team.group} Winner`
    if (pos === "2nd") return `As Group ${team.group} Runner-up`
    return `If ${team.name} qualifies as 3rd`
  }

  return (
    <div className="relative">
      {!isLast && (
        <div className="absolute left-1/2 -translate-x-px bottom-0 h-5 w-0.5 bg-gradient-to-b from-primary/20 to-primary/5" />
      )}

      <Card className={cn(
        "overflow-hidden border-border bg-card transition-all duration-300",
        isFinal && "border-primary/40 shadow-[0_0_40px_-12px_hsl(var(--primary)/0.3)]",
        isConditional && "border-primary/20"
      )}>
        {isFinal && <div className="absolute inset-0 bg-primary/5 pointer-events-none" />}

        <CardContent className="p-0">
          {/* Stage header */}
          <div className={cn(
            "flex items-center justify-between px-5 py-3 border-b border-border",
            isFinal ? "bg-primary/10" : isConditional ? "bg-primary/5" : "bg-secondary/30"
          )}>
            <div className="flex items-center gap-2 flex-wrap">
              {isFinal
                ? <Trophy className="w-4 h-4 text-primary flex-shrink-0" />
                : <Swords className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              <span className={cn("font-bold text-sm uppercase tracking-widest font-mono", isFinal ? "text-primary" : "text-foreground")}>
                {stage.description}
              </span>
              {isConditional && isProjected && (
                <span className="text-[10px] font-mono font-bold text-primary/60 uppercase tracking-widest">
                  · PROJECTED PATH
                </span>
              )}
              {isConditional && isUserLockedPath && (
                <span className="text-[10px] font-mono font-bold text-primary/60 uppercase tracking-widest">
                  · IF SELECTED PATH
                </span>
              )}
              {isConditional && !isProjected && !isUserLockedPath && (
                <span className="text-[10px] font-mono font-bold text-primary/60 uppercase tracking-widest">
                  · IF SELECTED PATH
                </span>
              )}
              {isAggregateFallback && (
                <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
                  · OVERALL OUTLOOK
                </span>
              )}
              {isConditional && stage.sampleCount !== undefined && stage.sampleCount < 100 && (
                <span
                  title={`Only ${stage.sampleCount} simulations match this scenario — treat probabilities as rough estimates`}
                  className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400/90 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5"
                >
                  ⚠ LOW CONFIDENCE · {stage.sampleCount} sims
                </span>
              )}
              {diff && (
                <span className={cn("hidden sm:flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-widest", diff.color)}>
                  {diff.icon} {diff.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Reach</span>
              <span className="text-lg font-bold font-mono text-foreground">
                {(stage.reachProbability * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Reach bar */}
          <div className="h-1 bg-secondary w-full">
            <div
              className={cn("h-full transition-all duration-1000 ease-out", isFinal ? "bg-primary" : isConditional ? "bg-primary/70" : "bg-primary/50")}
              style={{ width: `${stage.reachProbability * 100}%` }}
            />
          </div>

          {primary ? (
            <div className="p-5 space-y-4">
              {/* Main matchup */}
              <div className="flex items-center gap-3">
                {/* Team side */}
                <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                  <div className="flex items-center gap-3">
                    <TeamFlag flagCode={team.flagCode} size={36} className="flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate text-foreground">{team.name}</div>
                      <div className="text-[10px] font-mono text-primary uppercase tracking-wider">YOUR TEAM</div>
                    </div>
                  </div>
                  {teamTopFinish && isR32 && (
                    <GroupFinishBadge finishMap={displayTeamGroupFinish} group={team.group} side="team" />
                  )}
                </div>

                {/* VS */}
                <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
                  <div className="text-[10px] font-mono text-muted-foreground/60 font-bold">VS</div>
                  <div className="w-px h-8 bg-border" />
                </div>

                {/* Opponent side */}
                <div className="flex-1 flex flex-col items-end gap-1.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => onViewTeam(primary.team.id)}
                    className="flex items-center gap-3 justify-end group/opplink text-right"
                  >
                    <div className="min-w-0 text-right">
                      <div className="font-bold text-sm truncate text-foreground group-hover/opplink:text-primary transition-colors">{primary.team.name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                        #{primary.team.fifaRanking}
                      </div>
                    </div>
                    <TeamFlag flagCode={primary.team.flagCode} size={36} className="flex-shrink-0 group-hover/opplink:scale-110 transition-transform" />
                  </button>
                  {isR32 && primary.groupFinish && Object.keys(primary.groupFinish).length > 0 && (
                    <GroupFinishBadge finishMap={primary.groupFinish} group={primary.team.group} side="opponent" />
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/40 border border-border/50 rounded-lg p-3">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Encounter Chance</div>
                  <div className="text-xl font-bold font-mono text-foreground">
                    {(primary.encounterProbability * 100).toFixed(1)}%
                  </div>
                  <div className="mt-1.5 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-muted-foreground/40" style={{ width: `${primary.encounterProbability * 100}%` }} />
                  </div>
                </div>
                <div className="bg-secondary/40 border border-border/50 rounded-lg p-3">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Win Probability</div>
                  <div className={cn("text-xl font-bold font-mono", winRateColor(primary.winProbabilityIfFacing))}>
                    {(primary.winProbabilityIfFacing * 100).toFixed(1)}%
                  </div>
                  <div className="mt-1.5 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all duration-1000", primary.winProbabilityIfFacing >= 0.5 ? "bg-primary" : "bg-destructive")}
                      style={{ width: `${primary.winProbabilityIfFacing * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* R32: finish-grouped opponent sections */}
              {isR32 && stage.opponentsByFinish ? (
                <div className="space-y-3">
                  {lockedOpponentId && (
                    <button
                      onClick={() => onLockOpponent(null)}
                      className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 rounded-lg px-2.5 py-1.5 hover:bg-primary/20 transition-colors text-primary text-xs font-bold"
                    >
                      <X className="w-3.5 h-3.5" /> Reset selection
                    </button>
                  )}
                  {POS_ORDER.filter(pos => stage.opponentsByFinish![pos]?.length).map(pos => {
                    const opps = stage.opponentsByFinish![pos]
                    const finishProb = stage.teamGroupFinish[pos] ?? 0
                    const is3rd = pos === "3rd"
                    const topFinish = topKey(stage.teamGroupFinish)
                    const isMostLikely = pos === topFinish
                    const slotHint = formatOpponentSlotHints(
                      opponentSlotHintsForTeamFinish(
                        team.group,
                        pos as GroupFinish,
                        "round_of_32",
                      ),
                    )
                    return (
                      <div key={pos} className={cn(
                        "rounded-lg border p-3 space-y-2",
                        is3rd
                          ? "border-border/30 bg-secondary/10"
                          : isMostLikely
                            ? "border-primary/20 bg-primary/5"
                            : "border-border/50 bg-secondary/20"
                      )}>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[10px] font-mono font-bold uppercase tracking-wider",
                            is3rd ? "text-muted-foreground/60" : isMostLikely ? "text-primary" : "text-muted-foreground"
                          )}>
                            {finishLabel(pos)}
                          </span>
                          <span className={cn(
                            "text-[10px] font-mono px-1.5 py-0.5 rounded-full",
                            is3rd
                              ? "bg-secondary/60 text-muted-foreground/60"
                              : "bg-primary/10 text-primary/80"
                          )}>
                            {(finishProb * 100).toFixed(0)}%
                          </span>
                        </div>
                        {slotHint && (
                          <p className="text-[10px] font-mono text-muted-foreground/70">{slotHint}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {opps.map(opp => {
                            const isSelected = opp.team.id === lockedOpponentId
                            const lowConf = (opp.sampleCount ?? Infinity) < 50
                            return (
                              <button
                                key={opp.team.id}
                                onClick={() => onLockOpponent(isSelected ? null : opp.team.id, isSelected ? null : pos)}
                                className={cn(
                                  "flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors border text-left",
                                  isSelected
                                    ? "bg-amber-500/15 border-amber-500/40 ring-1 ring-amber-500/30"
                                    : is3rd
                                      ? "bg-secondary/20 border-border/30 hover:bg-secondary/40 hover:border-border/60"
                                      : "bg-secondary/30 border-border/40 hover:bg-secondary/60 hover:border-primary/30"
                                )}
                              >
                                {isSelected ? (
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => { e.stopPropagation(); onViewTeam(opp.team.id) }}
                                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onViewTeam(opp.team.id) } }}
                                    className="text-base hover:scale-125 transition-transform inline-block cursor-pointer"
                                    title={`View ${opp.team.name}'s bracket path`}
                                  ><TeamFlag flagCode={opp.team.flagCode} size={20} className="hover:scale-125 transition-transform cursor-pointer" /></span>
                                ) : (
                                  <TeamFlag flagCode={opp.team.flagCode} size={20} />
                                )}
                                <div>
                                  <div className={cn(
                                    "text-xs font-bold leading-none flex items-center gap-1",
                                    is3rd ? "text-muted-foreground" : "text-foreground"
                                  )}>
                                    {opp.team.name}
                                    {isSelected && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] font-mono text-muted-foreground/70">
                                      #{opp.team.fifaRanking}
                                    </span>
                                    <span
                                      className={cn("text-[10px] font-mono font-bold", winRateColor(opp.winProbabilityIfFacing))}
                                      title={lowConf ? `Based on only ${opp.sampleCount} simulations — rough estimate` : undefined}
                                    >
                                      {lowConf ? "~" : ""}{(opp.winProbabilityIfFacing * 100).toFixed(0)}% win
                                    </span>
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* Non-R32: flat alternate opponent list */
                secondary.length > 0 && (
                  <div>
                    <div className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider mb-2">
                      {lockedOpponentId ? "Switch opponent — tap to change" : "Select a different opponent to see updated path"}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {lockedOpponentId && (
                        <button
                          onClick={() => onLockOpponent(null)}
                          className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 rounded-lg px-2.5 py-1.5 hover:bg-primary/20 transition-colors text-primary"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold">Reset</span>
                        </button>
                      )}
                      {secondary.map(opp => {
                        const isSelected = opp.team.id === lockedOpponentId
                        const oppTopFinish = opp.groupFinish ? topKey(opp.groupFinish) : null
                        const lowConf = (opp.sampleCount ?? Infinity) < 50
                        return (
                          <button
                            key={opp.team.id}
                            onClick={() => onLockOpponent(isSelected ? null : opp.team.id, isSelected ? null : topKey(stage.teamGroupFinish))}
                            className={cn(
                              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors border text-left",
                              isSelected
                                ? "bg-amber-500/15 border-amber-500/40 ring-1 ring-amber-500/30"
                                : "bg-secondary/30 border-border/40 hover:bg-secondary/60 hover:border-primary/30"
                            )}
                          >
                            {isSelected ? (
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => { e.stopPropagation(); onViewTeam(opp.team.id) }}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onViewTeam(opp.team.id) } }}
                                className="text-lg hover:scale-125 transition-transform inline-block cursor-pointer"
                                title={`View ${opp.team.name}'s bracket path`}
                              ><TeamFlag flagCode={opp.team.flagCode} size={22} className="hover:scale-125 transition-transform cursor-pointer" /></span>
                            ) : (
                              <TeamFlag flagCode={opp.team.flagCode} size={22} />
                            )}
                            <div>
                              <div className="text-xs font-bold leading-none flex items-center gap-1">
                                {opp.team.name}
                                {isSelected && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {oppTopFinish && (
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    Grp {opp.team.group} {oppTopFinish}
                                  </span>
                                )}
                                <span className="text-[10px] font-mono text-muted-foreground">{(opp.encounterProbability * 100).toFixed(1)}% enc</span>
                                <span
                                  className={cn("text-[10px] font-mono font-bold", winRateColor(opp.winProbabilityIfFacing))}
                                  title={lowConf ? `Based on only ${opp.sampleCount} simulations — rough estimate` : undefined}
                                >
                                  {lowConf ? "~" : ""}{(opp.winProbabilityIfFacing * 100).toFixed(1)}% win
                                </span>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground text-sm italic">
              {stage.reachProbability > 0.01
                ? "No bracket-valid opponent on this path — reach reflects overall simulations."
                : "No likely opponents — team unlikely to reach this stage."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return <LoadingAnimation message="Loading bracket" />
}

// ─── panel ────────────────────────────────────────────────────────────────────

export interface BracketExplorerPanelProps {
  teamId: string
  onTeamChange: (id: string) => void
}

export function BracketExplorerPanel({ teamId, onTeamChange }: BracketExplorerPanelProps) {
  const { queryFlag } = useLiveMetrics()
  const { bracketLock, setBracketLock } = useHomeTab()
  const liveSuffix = queryFlag ? "&useLiveMetrics=1" : ""

  const lockedStage = bracketLock.lockStage
  const lockedOpponentId = bracketLock.lockOpp
  const lockedFinishPos = bracketLock.lockFinish

  const sims = simulationCount(!!queryFlag)

  const { data: rawBracketData, isLoading: isLoadingBracket, isError: isBracketError, refetch: refetchBracket } = useGetBracketExplorer(
    teamId,
    { useLiveMetrics: queryFlag, simulations: sims },
    {
      query: {
        enabled: !!teamId,
        queryKey: getGetBracketExplorerQueryKey(teamId, { useLiveMetrics: queryFlag, simulations: sims }),
      },
    },
  )

  // Cast to our enriched type
  const bracketData = rawBracketData as (typeof rawBracketData & {
    team: RichTeam
    path: RichStageNode[]
  }) | undefined

  const lockedPathResult = useMemo(() => {
    if (!bracketData?.path || !lockedStage || !lockedOpponentId) return null
    return buildLockedDisplayPath({
      path: bracketData.path,
      teamGroup: bracketData.team.group,
      lockedStage,
      lockedOpponentId,
      lockedFinishPos,
    })
  }, [bracketData?.path, bracketData?.team.group, lockedStage, lockedOpponentId, lockedFinishPos])

  const mostLikelyPathResult = useMemo(() => {
    if (!bracketData?.path || lockedStage) return null
    return buildMostLikelyPathResult(bracketData.path, bracketData.team.group)
  }, [bracketData?.path, bracketData?.team.group, lockedStage])

  const displayStages: RichStageNode[] = useMemo(() => {
    if (!bracketData?.path) return []
    if (lockedPathResult) return lockedPathResult.stages as RichStageNode[]
    return (mostLikelyPathResult?.stages ?? buildMostLikelyDisplayPath(
      bracketData.path,
      bracketData.team.group,
    )) as RichStageNode[]
  }, [bracketData?.path, bracketData?.team.group, lockedPathResult, mostLikelyPathResult])

  const isProjectedView =
    !lockedStage &&
    displayStages.some((s) => s.pathProjection === "projected")

  const displayWinProb =
    lockedPathResult?.winProbability ??
    (isProjectedView && mostLikelyPathResult
      ? mostLikelyPathResult.winProbability
      : bracketData?.tournamentWinProbability ?? 0)

  const handleLockOpponent = (stage: string, opponentId: string | null, finishPos?: string | null) => {
    if (opponentId === null) {
      setBracketLock({ lockStage: null, lockOpp: null, lockFinish: null })
    } else {
      const lockStageNode = bracketData?.path.find((s) => s.stage === stage) as
        | RichStageNode
        | undefined
      const finish = finishPos ?? inferFinishPosForOpponent(lockStageNode, opponentId)
      setBracketLock({
        lockStage: stage,
        lockOpp: opponentId,
        lockFinish: finish,
      })
    }
  }

  const pathStripTitle = lockedStage
    ? "Selected Path"
    : isProjectedView
      ? "Projected Path"
      : "Most Likely Path"

  const lockShareQs =
    lockedStage && lockedOpponentId
      ? `&lockStage=${encodeURIComponent(lockedStage)}&lockOpp=${encodeURIComponent(lockedOpponentId)}${
          lockedFinishPos ? `&lockFinish=${encodeURIComponent(lockedFinishPos)}` : ""
        }`
      : ""

  return (
    <div className="space-y-5">
      {!teamId ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-2xl bg-secondary/20">
          <GitBranch className="w-12 h-12 text-muted-foreground mb-4 opacity-40" />
          <h2 className="text-xl font-bold mb-2">Select a team above</h2>
          <p className="text-muted-foreground max-w-sm text-sm">
            Pick a nation to see its bracket path, likely opponents, and win probability.
          </p>
        </div>
      ) : isLoadingBracket ? (
        <LoadingSkeleton />
      ) : isBracketError ? (
        <QueryErrorState
          title="Could not load bracket"
          message="Bracket simulation failed. Try again or pick a different team."
          onRetry={() => refetchBracket()}
        />
      ) : bracketData ? (
        <div className="space-y-5">

          {/* Team hero */}
          <Card className="bg-card border-border overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 blur-[80px] -z-10 rounded-full" />
            <CardContent className="p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <TeamFlag flagCode={bracketData.team.flagCode} size={56} className="md:hidden filter drop-shadow-lg" />
                <TeamFlag flagCode={bracketData.team.flagCode} size={64} className="hidden md:block filter drop-shadow-lg" />
                <div>
                  <h2 className="text-2xl md:text-4xl font-bold tracking-tight">{bracketData.team.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="bg-secondary px-2.5 py-0.5 rounded-full text-xs font-medium border border-border">Group {bracketData.team.group}</span>
                    <span className="bg-secondary px-2.5 py-0.5 rounded-full text-xs font-medium border border-border">FIFA #{bracketData.team.fifaRanking}</span>
                    <span className="bg-secondary px-2.5 py-0.5 rounded-full text-xs font-medium border border-border">{bracketData.team.confederation}</span>
                  </div>
                </div>
              </div>
              <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-border pt-5 sm:pt-0 sm:pl-7 w-full sm:w-auto flex-shrink-0">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">
                  {lockedStage ? "Win Prob (selected path)" : "Tournament Win Probability"}
                </p>
                <div className="text-5xl md:text-6xl font-bold font-mono text-primary flex items-end justify-center sm:justify-end gap-1">
                  {(displayWinProb * 100).toFixed(1)}
                  <span className="text-2xl text-primary/50 mb-1.5">%</span>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground/50 mt-1">
                  {bracketData.simulationsRun.toLocaleString()} simulations
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            {(() => {
              let lockedOpponentName: string | null = null;
              if (lockedStage && lockedOpponentId && bracketData) {
                const lockStageNode = bracketData.path.find((s) => s.stage === lockedStage) as
                  | RichStageNode
                  | undefined;
                const lockOpp = resolveLockedOpponent(
                  lockStageNode,
                  lockedOpponentId,
                  lockedFinishPos,
                );
                lockedOpponentName = lockOpp?.team.name ?? null;
              }

              const share = buildBracketShareMessage({
                teamName: bracketData.team.name,
                winProbability: displayWinProb,
                simulationsRun: bracketData.simulationsRun,
                path: displayStages.map((s) => ({
                  stage: s.stage,
                  reachProbability: s.reachProbability,
                })),
                lockedStage,
                lockedOpponentName,
                useLiveMetrics: !!queryFlag,
                shareUrl: `${WORLDCUP_BASE}/?tab=path&section=bracket&team=${bracketData.team.id}${liveSuffix}${lockShareQs}`,
              });

              return (
                <SharePredictionButton payload={share} />
              );
            })()}
          </div>

          {/* Lock banner */}
          {lockedStage && lockedOpponentId && (() => {
            const lockStageData = bracketData.path.find(s => s.stage === lockedStage) as RichStageNode | undefined
            const lockOpp = resolveLockedOpponent(lockStageData, lockedOpponentId, lockedFinishPos) as
              | RichOpponent
              | undefined
            if (!lockOpp) return null
            return (
              <div className="flex items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2 text-sm">
                  <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="font-mono text-amber-300 font-bold text-xs uppercase tracking-wider">Path locked:</span>
                  <span className="text-foreground text-xs">
                    Facing <TeamFlag flagCode={lockOpp.team.flagCode} size={18} className="inline-block align-middle mx-0.5" /> <strong>{lockOpp.team.name}</strong> in the {
                      bracketData.path.find(s => s.stage === lockedStage)?.description
                    }. Future stages updated.
                  </span>
                </div>
                <button
                  onClick={() => setBracketLock({ lockStage: null, lockOpp: null, lockFinish: null })}
                  className="flex-shrink-0 text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )
          })()}

          {/* Path overview strip */}
          <Card className="bg-card border-border overflow-hidden">
            <CardContent className="p-4">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">
                {pathStripTitle}
              </div>
              <PathStrip
                team={bracketData.team as RichTeam}
                path={displayStages}
                winProb={displayWinProb}
                lockedStage={lockedStage}
              />
            </CardContent>
          </Card>

          {/* Stage detail cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest px-1">Stage-by-Stage Breakdown</h3>
            {displayStages.map((stage, i) => {
              const isLockedStage = stage.stage === lockedStage
              // For stages after the lock, they don't have their own lock control
              const isAfterLock = lockedStage
                ? knockoutStageIndex(stage.stage) > knockoutStageIndex(lockedStage)
                : false

              return (
                <StageCard
                  key={stage.stage}
                  stage={stage}
                  team={bracketData.team as RichTeam}
                  isLast={i === displayStages.length - 1}
                  lockedOpponentId={isLockedStage ? lockedOpponentId : null}
                  lockedFinishPos={isLockedStage ? lockedFinishPos : null}
                  onLockOpponent={(id, finishPos) => handleLockOpponent(stage.stage, id, finishPos)}
                  onViewTeam={onTeamChange}
                />
              )
            })}
          </div>

        </div>
      ) : null}
    </div>
  )
}
