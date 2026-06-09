import { useEffect, useState } from "react"
import { useLocation, Link } from "wouter"
import { useGetTeams, useGetBracketExplorer, getGetBracketExplorerQueryKey } from "@workspace/api-client-react"
import { TeamCombobox } from "@/components/TeamCombobox"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getFlagEmoji, cn } from "@/lib/utils"
import { ArrowLeft, Trophy, Swords, GitBranch, ChevronRight, Shield, Flame, Zap } from "lucide-react"

// ─── helpers ─────────────────────────────────────────────────────────────────

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

// ─── sub-components ──────────────────────────────────────────────────────────

function PathStrip({
  team,
  path,
  winProb,
}: {
  team: { name: string; flagCode: string; group: string }
  path: Array<{ stage: string; reachProbability: number; topOpponents: Array<{ team: { flagCode: string } }> }>
  winProb: number
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
      {/* Start node */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1 bg-primary/10 border border-primary/30 rounded-xl px-3 py-2.5 min-w-[60px] text-center">
        <span className="text-xl">{getFlagEmoji(team.flagCode)}</span>
        <span className="text-[10px] font-mono font-bold text-primary">GRP {team.group}</span>
      </div>

      {path.map((stage) => {
        const opp = stage.topOpponents[0]
        return (
          <div key={stage.stage} className="flex items-center gap-1">
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
            <div className={cn(
              "flex-shrink-0 flex flex-col items-center gap-1 rounded-xl px-3 py-2.5 min-w-[64px] text-center border transition-colors",
              stage.stage === "final"
                ? "bg-primary/15 border-primary/40"
                : "bg-secondary/50 border-border hover:border-primary/30"
            )}>
              <span className="text-[10px] font-mono text-muted-foreground font-bold uppercase">{SHORT_STAGE[stage.stage]}</span>
              <span className={cn("text-sm font-bold font-mono", stage.stage === "final" ? "text-primary" : "text-foreground")}>
                {(stage.reachProbability * 100).toFixed(0)}%
              </span>
              {opp && <span className="text-base leading-none">{getFlagEmoji(opp.team.flagCode)}</span>}
            </div>
          </div>
        )
      })}

      {/* Trophy */}
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

function StageCard({
  stage,
  team,
  isLast,
}: {
  stage: {
    stage: string
    description: string
    reachProbability: number
    topOpponents: Array<{
      team: { id: string; name: string; flagCode: string; group: string; fifaRanking: number; eloRating: number }
      encounterProbability: number
      winProbabilityIfFacing: number
    }>
  }
  team: { name: string; flagCode: string }
  isLast: boolean
}) {
  const isFinal = stage.stage === "final"
  const primary = stage.topOpponents[0]
  const secondary = stage.topOpponents.slice(1)
  const diff = primary ? difficultyLabel(primary.winProbabilityIfFacing) : null

  return (
    <div className="relative">
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-1/2 -translate-x-px bottom-0 h-5 w-0.5 bg-gradient-to-b from-primary/20 to-primary/5" />
      )}

      <Card className={cn(
        "overflow-hidden border-border bg-card transition-all duration-300",
        isFinal && "border-primary/40 shadow-[0_0_40px_-12px_hsl(var(--primary)/0.3)]"
      )}>
        {isFinal && <div className="absolute inset-0 bg-primary/5 pointer-events-none" />}

        <CardContent className="p-0">
          {/* Stage header */}
          <div className={cn(
            "flex items-center justify-between px-5 py-3 border-b border-border",
            isFinal ? "bg-primary/10" : "bg-secondary/30"
          )}>
            <div className="flex items-center gap-2">
              {isFinal
                ? <Trophy className="w-4 h-4 text-primary" />
                : <Swords className="w-4 h-4 text-muted-foreground" />}
              <span className={cn("font-bold text-sm uppercase tracking-widest font-mono", isFinal ? "text-primary" : "text-foreground")}>
                {stage.description}
              </span>
              {diff && (
                <span className={cn("hidden sm:flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-widest ml-1", diff.color)}>
                  {diff.icon} {diff.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Reach</span>
              <span className="text-lg font-bold font-mono text-foreground">
                {(stage.reachProbability * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Reach probability bar */}
          <div className="h-1 bg-secondary w-full">
            <div
              className={cn("h-full transition-all duration-1000 ease-out", isFinal ? "bg-primary" : "bg-primary/50")}
              style={{ width: `${stage.reachProbability * 100}%` }}
            />
          </div>

          {primary ? (
            <div className="p-5 space-y-4">
              {/* Main matchup */}
              <div className="flex items-center gap-3">
                {/* Team side */}
                <div className="flex-1 flex items-center gap-3 min-w-0">
                  <span className="text-4xl flex-shrink-0">{getFlagEmoji(team.flagCode)}</span>
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate text-foreground">{team.name}</div>
                    <div className="text-[10px] font-mono text-primary uppercase tracking-wider">YOUR TEAM</div>
                  </div>
                </div>

                {/* VS divider */}
                <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
                  <div className="text-[10px] font-mono text-muted-foreground/60 font-bold">VS</div>
                  <div className="w-px h-8 bg-border" />
                </div>

                {/* Opponent side */}
                <div className="flex-1 flex items-center gap-3 min-w-0 justify-end text-right">
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate text-foreground">{primary.team.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                      GRP {primary.team.group} · #{primary.team.fifaRanking}
                    </div>
                  </div>
                  <span className="text-4xl flex-shrink-0">{getFlagEmoji(primary.team.flagCode)}</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Encounter probability */}
                <div className="bg-secondary/40 border border-border/50 rounded-lg p-3">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Encounter Chance</div>
                  <div className="text-xl font-bold font-mono text-foreground">
                    {(primary.encounterProbability * 100).toFixed(1)}%
                  </div>
                  <div className="mt-1.5 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-muted-foreground/40" style={{ width: `${primary.encounterProbability * 100}%` }} />
                  </div>
                </div>

                {/* Win probability */}
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

              {/* Secondary opponents */}
              {secondary.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider mb-2">Other Possible Opponents</div>
                  <div className="flex flex-wrap gap-2">
                    {secondary.map(opp => (
                      <div
                        key={opp.team.id}
                        className="flex items-center gap-1.5 bg-secondary/30 border border-border/40 rounded-lg px-2.5 py-1.5 hover:bg-secondary/50 transition-colors"
                      >
                        <span className="text-lg">{getFlagEmoji(opp.team.flagCode)}</span>
                        <div>
                          <div className="text-xs font-bold leading-none">{opp.team.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-muted-foreground">{(opp.encounterProbability * 100).toFixed(1)}% enc</span>
                            <span className={cn("text-[10px] font-mono font-bold", winRateColor(opp.winProbabilityIfFacing))}>
                              {(opp.winProbabilityIfFacing * 100).toFixed(1)}% win
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
  const [teamId, setTeamId] = useState("")

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("team")
    if (t) setTeamId(t)
  }, [window.location.search])

  const handleTeamChange = (id: string) => {
    setTeamId(id)
    setLocation(`/bracket?team=${id}`)
  }

  const { data: teams = [], isLoading: isLoadingTeams } = useGetTeams()
  const { data: bracketData, isLoading: isLoadingBracket } = useGetBracketExplorer(
    teamId, {},
    { query: { enabled: !!teamId, queryKey: getGetBracketExplorerQueryKey(teamId) } }
  )

  return (
    <div className="min-h-[100dvh] w-full flex flex-col pt-6 pb-24 px-4 md:px-8 max-w-4xl mx-auto relative z-10">

      {/* Nav */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>

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
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Tournament Win Probability</p>
                <div className="text-5xl md:text-6xl font-bold font-mono text-primary flex items-end justify-center sm:justify-end gap-1">
                  {(bracketData.tournamentWinProbability * 100).toFixed(1)}
                  <span className="text-2xl text-primary/50 mb-1.5">%</span>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground/50 mt-1">
                  {bracketData.simulationsRun.toLocaleString()} simulations
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Path overview strip */}
          <Card className="bg-card border-border overflow-hidden">
            <CardContent className="p-4">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Most Likely Path</div>
              <PathStrip
                team={bracketData.team}
                path={bracketData.path}
                winProb={bracketData.tournamentWinProbability}
              />
            </CardContent>
          </Card>

          {/* Stage detail cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest px-1">Stage-by-Stage Breakdown</h3>
            {bracketData.path.map((stage, i) => (
              <StageCard
                key={stage.stage}
                stage={stage}
                team={bracketData.team}
                isLast={i === bracketData.path.length - 1}
              />
            ))}
          </div>

        </div>
      ) : null}

    </div>
  )
}
