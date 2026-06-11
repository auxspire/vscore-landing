import { useEffect, useState } from "react"
import { useLocation, useSearch, Link } from "wouter"
import { useGetTeams, useGetBracketExplorer, getGetBracketExplorerQueryKey } from "@workspace/api-client-react"
import { TeamCombobox } from "@/components/TeamCombobox"
import { Navbar } from "@/components/Navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getFlagEmoji, cn } from "@/lib/utils"
import { ArrowLeft, Trophy, Swords, GitBranch, ChevronRight, Shield, Flame, Zap, Lock, X } from "lucide-react"

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

const KNOCKOUT_STAGES = ["round_of_32", "round_of_16", "quarterfinal", "semifinal", "final"]

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
        <span className="text-xl">{getFlagEmoji(team.flagCode)}</span>
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
              {opp && <span className="text-base leading-none">{getFlagEmoji(opp.team.flagCode)}</span>}
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
}: {
  stage: RichStageNode
  team: RichTeam
  isLast: boolean
  lockedOpponentId: string | null
  /** Which finish-position section the locked opponent was clicked from (R32 only) */
  lockedFinishPos: string | null
  onLockOpponent: (id: string | null, finishPos?: string | null) => void
}) {
  const isFinal       = stage.stage === "final"
  const isConditional = stage.isConditional === true
  const isR32         = stage.stage === "round_of_32"

  // For R32 with finish groups, primary comes from the most-likely finish section
  const r32DefaultPrimary = isR32 && stage.opponentsByFinish
    ? (() => {
        const top = topKey(stage.teamGroupFinish)
        return (top && stage.opponentsByFinish[top]?.[0]) ?? stage.topOpponents[0]
      })()
    : null

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
    : (r32DefaultPrimary ?? stage.topOpponents[0])

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
              {isConditional && (
                <span className="text-[10px] font-mono font-bold text-primary/60 uppercase tracking-widest">
                  · IF SELECTED PATH
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
                    <span className="text-4xl flex-shrink-0">{getFlagEmoji(team.flagCode)}</span>
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
                  <Link
                    href={`/bracket?team=${primary.team.id}`}
                    className="flex items-center gap-3 justify-end group/opplink"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="min-w-0 text-right">
                      <div className="font-bold text-sm truncate text-foreground group-hover/opplink:text-primary transition-colors">{primary.team.name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                        #{primary.team.fifaRanking}
                      </div>
                    </div>
                    <span className="text-4xl flex-shrink-0 group-hover/opplink:scale-110 transition-transform">{getFlagEmoji(primary.team.flagCode)}</span>
                  </Link>
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
                        <div className="flex flex-wrap gap-1.5">
                          {opps.map(opp => {
                            const isSelected = opp.team.id === lockedOpponentId
                            const oppTopFinish = opp.groupFinish ? topKey(opp.groupFinish) : null
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
                                <Link
                                  href={`/bracket?team=${opp.team.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-base hover:scale-125 transition-transform inline-block"
                                  title={`View ${opp.team.name}'s bracket path`}
                                >{getFlagEmoji(opp.team.flagCode)}</Link>
                                <div>
                                  <div className={cn(
                                    "text-xs font-bold leading-none flex items-center gap-1",
                                    is3rd ? "text-muted-foreground" : "text-foreground"
                                  )}>
                                    {opp.team.name}
                                    {isSelected && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    {oppTopFinish && (
                                      <span className="text-[10px] font-mono text-muted-foreground/70">
                                        Grp {opp.team.group} {oppTopFinish}
                                      </span>
                                    )}
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
                            onClick={() => onLockOpponent(isSelected ? null : opp.team.id)}
                            className={cn(
                              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors border text-left",
                              isSelected
                                ? "bg-amber-500/15 border-amber-500/40 ring-1 ring-amber-500/30"
                                : "bg-secondary/30 border-border/40 hover:bg-secondary/60 hover:border-primary/30"
                            )}
                          >
                            <Link
                              href={`/bracket?team=${opp.team.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-lg hover:scale-125 transition-transform inline-block"
                              title={`View ${opp.team.name}'s bracket path`}
                            >{getFlagEmoji(opp.team.flagCode)}</Link>
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
              No likely opponents — team unlikely to reach this stage.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <Skeleton className="h-16 w-full rounded-2xl bg-secondary/50" />
      <Skeleton className="h-14 w-full rounded-xl bg-secondary/40" />
      {[0, 1, 2, 3, 4].map(i => (
        <Skeleton key={i} className="w-full rounded-xl bg-secondary/50" style={{ height: `${180 - i * 6}px` }} />
      ))}
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function Bracket() {
  const [, setLocation] = useLocation()
  const search = useSearch()
  const teamId = new URLSearchParams(search).get("team") ?? ""

  const [lockedStage, setLockedStage]           = useState<string | null>(null)
  const [lockedOpponentId, setLockedOpponentId] = useState<string | null>(null)
  const [lockedFinishPos, setLockedFinishPos]   = useState<string | null>(null)

  // Clear locks whenever the team in the URL changes
  useEffect(() => {
    setLockedStage(null)
    setLockedOpponentId(null)
    setLockedFinishPos(null)
  }, [teamId])

  // Navigate to a different team
  const handleTeamChange = (id: string) => {
    setLocation(`/bracket?team=${id}`)
  }

  const handleLockOpponent = (stage: string, opponentId: string | null, finishPos?: string | null) => {
    if (opponentId === null) {
      setLockedStage(null)
      setLockedOpponentId(null)
      setLockedFinishPos(null)
    } else {
      setLockedStage(stage)
      setLockedOpponentId(opponentId)
      setLockedFinishPos(finishPos ?? null)
    }
  }

  const { data: teams = [], isLoading: isLoadingTeams } = useGetTeams()
  const { data: rawBracketData, isLoading: isLoadingBracket } = useGetBracketExplorer(
    teamId, {},
    { query: { enabled: !!teamId, queryKey: getGetBracketExplorerQueryKey(teamId) } }
  )

  // Cast to our enriched type
  const bracketData = rawBracketData as (typeof rawBracketData & {
    team: RichTeam
    path: RichStageNode[]
  }) | undefined

  // Build display stages: inject conditional data for stages after the locked one
  const displayStages: RichStageNode[] = bracketData?.path
    ? bracketData.path.map(stage => {
        const stageIdx  = KNOCKOUT_STAGES.indexOf(stage.stage)
        const lockIdx   = lockedStage ? KNOCKOUT_STAGES.indexOf(lockedStage) : -1

        if (!lockedStage || stageIdx < lockIdx) {
          // Normal, before the lock
          return stage
        }

        if (stageIdx === lockIdx) {
          // This is the locked stage — reorder opponents so locked one is "primary"
          const locked  = stage.topOpponents.find(o => o.team.id === lockedOpponentId)
          const others  = stage.topOpponents.filter(o => o.team.id !== lockedOpponentId)
          return {
            ...stage,
            topOpponents: locked ? [locked, ...others] : stage.topOpponents,
          }
        }

        // Stages after the lock: use conditional path data from the locked opponent
        const lockStageNode = bracketData.path.find(s => s.stage === lockedStage)
        const lockOpp = lockStageNode?.topOpponents.find(o => o.team.id === lockedOpponentId)
        const cpEntry = lockOpp?.conditionalPath?.find(cp => cp.stage === stage.stage)

        if (cpEntry) {
          return {
            ...stage,
            reachProbability: cpEntry.reachProbability,
            topOpponents: cpEntry.topOpponents as RichOpponent[],
            teamGroupFinish: stage.teamGroupFinish,
            isConditional: true,
            sampleCount: cpEntry.sampleCount,
          }
        }

        return { ...stage, isConditional: true }
      })
    : []

  // Compute conditional win probability when lock is active
  const displayWinProb = (() => {
    if (!bracketData || !lockedStage || !lockedOpponentId) {
      return bracketData?.tournamentWinProbability ?? 0
    }
    // Find locked opponent — search topOpponents first, then opponentsByFinish for R32
    const lockStageNode = bracketData.path.find(s => s.stage === lockedStage)
    const lockOpp = lockStageNode?.topOpponents.find(o => o.team.id === lockedOpponentId)
      ?? (lockStageNode?.opponentsByFinish
        ? Object.values(lockStageNode.opponentsByFinish).flat().find(o => o.team.id === lockedOpponentId)
        : undefined)
    const finalCp = lockOpp?.conditionalPath?.find(cp => cp.stage === "final")
    if (finalCp) {
      // Conditional win = reachFinalGivenLock * winIfInFinal
      const avgWin = finalCp.topOpponents.length > 0
        ? finalCp.topOpponents.reduce((s, o) => s + o.winProbabilityIfFacing * o.encounterProbability, 0) /
          finalCp.topOpponents.reduce((s, o) => s + o.encounterProbability, 0)
        : 0.5
      // Cap at 1.0 — low sample sizes can produce reachProbability = 1
      return Math.min(1, finalCp.reachProbability * avgWin)
    }
    return bracketData.tournamentWinProbability
  })()

  return (
    <div className="min-h-[100dvh] w-full flex flex-col">
      <Navbar />
      <div className="flex-1 pt-6 pb-24 px-4 md:px-8 max-w-4xl mx-auto w-full relative z-10">

      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wider text-primary bg-primary/10 border border-primary/20">
            <GitBranch className="w-3 h-3" /> PATH VISUALIZER
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">BRACKET PATH</h1>
        </div>
        <div className="w-full md:w-80">
          <label className="text-xs font-mono text-muted-foreground font-bold tracking-wider uppercase ml-1 block mb-2">Select Team</label>
          <TeamCombobox
            teams={teams}
            value={teamId}
            onChange={handleTeamChange}
            placeholder="Choose a team..."
            disabled={isLoadingTeams}
          />
        </div>
      </header>

      {!teamId ? (
        <div className="flex flex-col items-center justify-center py-32 text-center border border-dashed border-border rounded-2xl bg-secondary/20">
          <GitBranch className="w-16 h-16 text-muted-foreground mb-4 opacity-30" />
          <h2 className="text-2xl font-bold mb-2">Select a team</h2>
          <p className="text-muted-foreground max-w-sm text-sm">
            Pick any of the 48 qualified nations to visualize their simulated path through the bracket — stage by stage, matchup by matchup.
          </p>
        </div>
      ) : isLoadingBracket ? (
        <LoadingSkeleton />
      ) : bracketData ? (
        <div className="space-y-5">

          {/* Team hero */}
          <Card className="bg-card border-border overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 blur-[80px] -z-10 rounded-full" />
            <CardContent className="p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <span className="text-6xl md:text-7xl filter drop-shadow-lg">{getFlagEmoji(bracketData.team.flagCode)}</span>
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

          {/* Lock banner */}
          {lockedStage && lockedOpponentId && (() => {
            const lockStageData = bracketData.path.find(s => s.stage === lockedStage)
            // For R32, the locked opponent may only exist in opponentsByFinish, not topOpponents
            const lockOpp = lockStageData?.topOpponents.find(o => o.team.id === lockedOpponentId)
              ?? (lockStageData?.opponentsByFinish
                ? Object.values(lockStageData.opponentsByFinish).flat().find(o => o.team.id === lockedOpponentId)
                : undefined)
            if (!lockOpp) return null
            return (
              <div className="flex items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2 text-sm">
                  <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="font-mono text-amber-300 font-bold text-xs uppercase tracking-wider">Path locked:</span>
                  <span className="text-foreground text-xs">
                    Facing {getFlagEmoji(lockOpp.team.flagCode)} <strong>{lockOpp.team.name}</strong> in the {
                      bracketData.path.find(s => s.stage === lockedStage)?.description
                    }. Future stages updated.
                  </span>
                </div>
                <button
                  onClick={() => { setLockedStage(null); setLockedOpponentId(null) }}
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
                {lockedStage ? "Projected Path (with selection)" : "Most Likely Path"}
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
                ? KNOCKOUT_STAGES.indexOf(stage.stage) > KNOCKOUT_STAGES.indexOf(lockedStage)
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
                />
              )
            })}
          </div>

        </div>
      ) : null}

      </div>
    </div>
  )
}
