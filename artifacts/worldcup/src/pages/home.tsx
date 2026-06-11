import { useState } from "react"
import { useLocation, Link } from "wouter"
import { useGetTeams, useGetPopularMatchups } from "@workspace/api-client-react"
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
        <div className="flex items-center gap-2">
          <Link href="/bracket" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-bold uppercase tracking-wider text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/10 transition-colors">
            <GitBranch className="w-4 h-4" /> Bracket <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <header className="mb-12 text-center md:text-left">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4 text-foreground leading-[1.1]">
          TACTICAL <br className="hidden md:block"/> MATCH PREDICTOR
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto md:mx-0">
          Run 10,000 simulations to calculate the exact probability of any two teams meeting at each stage of the 2026 World Cup.
        </p>
      </header>

      <div className="grid md:grid-cols-[1fr,auto,1fr] gap-6 items-center mb-16 relative">
        <div className="absolute inset-0 bg-primary/5 blur-[100px] -z-10 rounded-full" />
        
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono text-muted-foreground font-bold tracking-wider uppercase ml-1">Team 1</label>
          <TeamCombobox 
            teams={teams} 
            value={teamA} 
            onChange={setTeamA} 
            placeholder="Select first team..."
            disabled={isLoadingTeams}
          />
        </div>

        <div className="flex justify-center -my-2 md:my-0">
          <div className="bg-secondary text-muted-foreground rounded-full p-4 border border-border shadow-xl">
            <Swords className="w-6 h-6" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono text-muted-foreground font-bold tracking-wider uppercase ml-1">Team 2</label>
          <TeamCombobox 
            teams={teams} 
            value={teamB} 
            onChange={(val) => {
              if (val === teamA) return;
              setTeamB(val);
            }} 
            placeholder="Select opponent..."
            disabled={isLoadingTeams}
          />
        </div>
      </div>

      <div className="flex justify-center mb-24">
        <Button 
          size="lg" 
          className="h-16 px-12 text-lg font-bold tracking-wide uppercase shadow-[0_0_40px_-10px_hsl(var(--primary))]"
          disabled={!teamA || !teamB || teamA === teamB}
          onClick={handlePredict}
        >
          Run Simulation
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-6 tracking-tight flex items-center gap-2">
          Popular Matchups
        </h2>
        
        {isLoadingMatchups ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 bg-secondary/50 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularMatchups.map((matchup, i) => (
              <Card 
                key={i} 
                className="bg-card hover:bg-secondary/50 transition-colors cursor-pointer border-border hover:border-primary/50 group overflow-hidden relative"
                onClick={() => setLocation(`/matchup?teamA=${matchup.teamA.id}&teamB=${matchup.teamB.id}`)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{getFlagEmoji(matchup.teamA.flagCode)}</span>
                      <span className="font-bold text-lg">{matchup.teamA.name}</span>
                    </div>
                    <span className="text-muted-foreground text-sm font-bold">vs</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{matchup.teamB.name}</span>
                      <span className="text-3xl">{getFlagEmoji(matchup.teamB.flagCode)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-mono tracking-wider">{matchup.label}</p>
                      <p className="text-sm font-medium mt-1">Most likely: <span className="capitalize text-foreground">{matchup.mostLikelyStage.replace(/_/g, ' ')}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase font-mono tracking-wider mb-1">Probability</p>
                      <p className="text-xl font-bold font-mono text-primary">{(matchup.totalProbability * 100).toFixed(1)}%</p>
                    </div>
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
