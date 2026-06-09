import { useState } from "react"
import { Link } from "wouter"
import { useGetTournamentRankings } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getFlagEmoji, cn } from "@/lib/utils"
import { ArrowLeft, Trophy, Medal, Activity, GitBranch, ChevronRight } from "lucide-react"

const STAGES = [
  { key: "r32Probability",       label: "R32",   short: "R32" },
  { key: "r16Probability",       label: "R16",   short: "R16" },
  { key: "quarterProbability",   label: "QF",    short: "QF"  },
  { key: "semifinalProbability", label: "SF",    short: "SF"  },
  { key: "finalProbability",     label: "Final", short: "F"   },
  { key: "winProbability",       label: "Win",   short: "W"   },
] as const

type StageKey = typeof STAGES[number]["key"]

function rankMedal(rank: number) {
  if (rank === 1) return <Trophy className="w-4 h-4 text-yellow-400" />
  if (rank === 2) return <Medal  className="w-4 h-4 text-slate-300" />
  if (rank === 3) return <Medal  className="w-4 h-4 text-amber-600" />
  return <span className="text-xs font-mono text-muted-foreground w-4 text-center">{rank}</span>
}

function winColor(prob: number) {
  if (prob >= 0.12) return "text-primary"
  if (prob >= 0.06) return "text-amber-400"
  if (prob >= 0.03) return "text-orange-400"
  return "text-muted-foreground"
}

function stageBarColor(key: StageKey) {
  if (key === "winProbability")       return "bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
  if (key === "finalProbability")     return "bg-amber-400"
  if (key === "semifinalProbability") return "bg-orange-400"
  return "bg-secondary-foreground/50"
}

type SortKey = StageKey | "rank"

export default function Rankings() {
  const [sortBy, setSortBy] = useState<SortKey>("rank")

  const { data, isLoading } = useGetTournamentRankings(
    { simulations: 10000 },
    { query: { staleTime: 5 * 60 * 1000 } }
  )

  const sorted = data?.rankings
    ? sortBy === "rank"
      ? [...data.rankings]
      : [...data.rankings].sort((a, b) => {
          const aVal = sortBy === "rank" ? a.rank : (a[sortBy as StageKey] ?? 0)
          const bVal = sortBy === "rank" ? b.rank : (b[sortBy as StageKey] ?? 0)
          return (bVal as number) - (aVal as number)
        })
    : []

  return (
    <div className="min-h-[100dvh] w-full pt-8 pb-24 px-4 md:px-8 max-w-5xl mx-auto">

      {/* Header nav */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Home
        </Link>
        <Link
          href="/bracket"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors"
        >
          <GitBranch className="w-3 h-3" /> Bracket Path
        </Link>
      </div>

      {/* Page title */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-6 h-6 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Tournament Power Rankings</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          All 48 teams ranked by win probability via a single batch of{" "}
          {data ? data.simulationsRun.toLocaleString() : "10,000"} Monte Carlo simulations
        </p>
      </div>

      {/* Sort controls */}
      <div className="flex flex-wrap gap-2 mb-6">
        {([{ key: "rank", label: "Win %" }, ...STAGES.slice(0, 5).map(s => ({ key: s.key, label: s.label }))] as { key: SortKey; label: string }[]).map(s => (
          <button
            key={s.key}
            onClick={() => setSortBy(s.key)}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors",
              sortBy === s.key
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="bg-card border-border shadow-lg overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-border/50 bg-secondary/20">
          <div className="grid grid-cols-[2rem,1fr,6rem,repeat(5,3.5rem)] gap-2 items-center">
            <span className="text-xs font-mono text-muted-foreground">#</span>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Team</span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary text-right">Win %</span>
            {STAGES.slice(0, 5).map(s => (
              <span key={s.key} className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">{s.short}</span>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-0 divide-y divide-border/30">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[2rem,1fr,6rem,repeat(5,3.5rem)] gap-2 items-center px-4 py-3">
                  <Skeleton className="h-4 w-4 bg-secondary" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded bg-secondary" />
                    <Skeleton className="h-4 w-24 bg-secondary" />
                  </div>
                  <Skeleton className="h-5 w-full bg-secondary" />
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Skeleton key={j} className="h-3 w-full bg-secondary" />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {sorted.map((entry, idx) => {
                const isTop3 = entry.rank <= 3
                return (
                  <div
                    key={entry.team.id}
                    className={cn(
                      "grid grid-cols-[2rem,1fr,6rem,repeat(5,3.5rem)] gap-2 items-center px-4 py-3 group hover:bg-secondary/30 transition-colors",
                      isTop3 && "bg-primary/[0.04]"
                    )}
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center">
                      {rankMedal(entry.rank)}
                    </div>

                    {/* Team */}
                    <Link
                      href={`/bracket?team=${entry.team.id}`}
                      className="flex items-center gap-2 min-w-0 hover:text-primary transition-colors"
                    >
                      <span className="text-xl leading-none flex-shrink-0">
                        {getFlagEmoji(entry.team.flagCode)}
                      </span>
                      <div className="min-w-0">
                        <div className={cn("text-sm font-semibold leading-tight truncate", isTop3 && "text-primary")}>
                          {entry.team.name}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground tracking-wider">
                          Group {entry.team.group}
                        </div>
                      </div>
                      <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex-shrink-0" />
                    </Link>

                    {/* Win probability — prominent */}
                    <div className="text-right">
                      <span className={cn("text-base font-bold font-mono", winColor(entry.winProbability))}>
                        {(entry.winProbability * 100).toFixed(1)}
                        <span className="text-xs text-muted-foreground">%</span>
                      </span>
                      {/* mini bar */}
                      <div className="mt-1 h-1 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.max(1, entry.winProbability * 100 * 5)}%` }}
                        />
                      </div>
                    </div>

                    {/* Stage bars */}
                    {STAGES.slice(0, 5).map(s => {
                      const val = entry[s.key as StageKey] as number
                      return (
                        <div key={s.key} className="text-right">
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
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {data && (
        <p className="text-center text-xs font-mono text-muted-foreground mt-6">
          <Activity className="inline w-3 h-3 mr-1 text-primary" />
          {data.simulationsRun.toLocaleString()} simulations · probabilities vary slightly on each load
        </p>
      )}
    </div>
  )
}
