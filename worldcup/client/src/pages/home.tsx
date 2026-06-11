import { useState } from "react"
import { useLocation, Link } from "wouter"
import { useGetTeams, useGetPopularMatchups } from "@/lib/api"
import { TeamCombobox } from "@/components/TeamCombobox"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getFlagEmoji } from "@/lib/utils"
import { Swords, Activity, ArrowRight, GitBranch, Trophy } from "lucide-react"

export default function Home() {
  const [, setLocation] = useLocation()
  const [teamA, setTeamA] = useState<string>("")
  const [teamB, setTeamB] = useState<string>("")

  const { data: teams = [], isLoading: isLoadingTeams } = useGetTeams()
  const { data: popularMatchups = [], isLoading: isLoadingMatchups } = useGetPopularMatchups()

  const handlePredict = () => {
    if (teamA && teamB && teamA !== teamB) {
      setLocation(`/matchup?teamA=${teamA}&teamB=${teamB}`)
    }
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col pt-6 pb-24 px-4 md:px-8 max-w-5xl mx-auto relative z-10">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="inline-flex items-center gap-2 bg-secondary/50 px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wider text-primary border border-border">
          <Activity className="w-3 h-3" /> MONTE CARLO ENGINE ONLINE
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/rankings"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
          >
            <Trophy className="w-3 h-3" /> Power Rankings
          </Link>
          <Link
            href="/bracket"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors"
          >
            <GitBranch className="w-3 h-3" /> Bracket Path
          </Link>
        </div>
      </div>

      <div className="flex flex-col items-center text-center mb-16 mt-8">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4 leading-none">
          WORLD CUP<br />
          <span className="text-primary">PREDICTOR</span>
        </h1>
        <p className="text-muted-foreground max-w-md text-sm md:text-base font-mono">
          Monte Carlo simulation engine — 10,000 tournament brackets per prediction
        </p>
      </div>

      <div className="w-full max-w-2xl mx-auto space-y-4 mb-16">
        <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-center">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground font-bold tracking-wider uppercase ml-1">Team A</label>
            <TeamCombobox
              teams={teams}
              value={teamA}
              onChange={setTeamA}
              placeholder="Select team..."
              disabled={isLoadingTeams}
            />
          </div>
          <div className="mt-6 flex items-center justify-center w-10 h-14 rounded-xl bg-secondary/50 border border-border text-muted-foreground font-bold text-sm">
            VS
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground font-bold tracking-wider uppercase ml-1">Team B</label>
            <TeamCombobox
              teams={teams}
              value={teamB}
              onChange={setTeamB}
              placeholder="Select team..."
              disabled={isLoadingTeams}
            />
          </div>
        </div>

        <Button
          className="w-full h-14 text-base font-bold uppercase tracking-widest gap-3"
          onClick={handlePredict}
          disabled={!teamA || !teamB || teamA === teamB}
        >
          <Swords className="w-5 h-5" />
          Run Simulation
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>

      <div className="w-full max-w-2xl mx-auto">
        <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
          <Activity className="w-3 h-3 text-primary" /> Popular Matchups
        </h2>
        {isLoadingMatchups ? (
          <div className="space-y-2">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full bg-secondary/50 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {popularMatchups.map((matchup, i) => (
              <Card
                key={i}
                className="bg-card border-border hover:border-primary/30 hover:bg-secondary/30 transition-all cursor-pointer group"
                onClick={() => setLocation(`/matchup?teamA=${matchup.teamA.id}&teamB=${matchup.teamB.id}`)}
              >
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl">{getFlagEmoji(matchup.teamA.flagCode)}</span>
                    <span className="font-semibold text-sm truncate">{matchup.teamA.name}</span>
                    <span className="text-muted-foreground text-xs font-mono">vs</span>
                    <span className="font-semibold text-sm truncate">{matchup.teamB.name}</span>
                    <span className="text-2xl">{getFlagEmoji(matchup.teamB.flagCode)}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="hidden sm:block text-right">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{matchup.label}</div>
                      <div className="text-sm font-bold font-mono text-primary">{(matchup.totalProbability * 100).toFixed(1)}% meet</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
