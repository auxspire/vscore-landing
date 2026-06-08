import { useEffect, useState } from "react"
import { useLocation, Link } from "wouter"
import { useGetTeams, useGetBracketExplorer, getGetBracketExplorerQueryKey } from "@workspace/api-client-react"
import { TeamCombobox } from "@/components/TeamCombobox"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getFlagEmoji, cn } from "@/lib/utils"
import { ArrowLeft, Trophy, Swords, GitBranch } from "lucide-react"

export default function Bracket() {
  const [location, setLocation] = useLocation()
  
  // Extract team from query params manually since wouter doesn't have useSearchParams by default
  const [teamId, setTeamId] = useState<string>("")
  
  useEffect(() => {
    const search = window.location.search
    const params = new URLSearchParams(search)
    const t = params.get("team")
    if (t && t !== teamId) {
      setTeamId(t)
    }
  }, [window.location.search])

  const handleTeamChange = (newTeamId: string) => {
    setTeamId(newTeamId)
    setLocation(`/bracket?team=${newTeamId}`)
  }

  const { data: teams = [], isLoading: isLoadingTeams } = useGetTeams()

  const { data: bracketData, isLoading: isLoadingBracket } = useGetBracketExplorer(
    teamId, 
    {}, 
    { 
      query: { 
        enabled: !!teamId, 
        queryKey: getGetBracketExplorerQueryKey(teamId) 
      } 
    }
  )

  return (
    <div className="min-h-[100dvh] w-full flex flex-col pt-6 pb-24 px-4 md:px-8 max-w-5xl mx-auto relative z-10">
      
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>

      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wider text-primary bg-primary/10 border border-primary/20">
            <GitBranch className="w-3 h-3" /> PATH SIMULATOR
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground">
            BRACKET EXPLORER
          </h1>
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
          <GitBranch className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Select a team to view their path</h2>
          <p className="text-muted-foreground max-w-md">
            Choose any qualified team to simulate their most likely route to the World Cup Final and see their potential matchups at each knockout stage.
          </p>
        </div>
      ) : isLoadingBracket ? (
        <div className="space-y-8">
          <Skeleton className="h-40 w-full rounded-2xl bg-secondary/50" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-32 w-full rounded-xl bg-secondary/50" />
            ))}
          </div>
        </div>
      ) : bracketData ? (
        <div className="space-y-8">
          
          {/* Team Hero */}
          <Card className="bg-card border-border overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[100px] -z-10 rounded-full" />
            <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <span className="text-7xl md:text-8xl filter drop-shadow-lg">{getFlagEmoji(bracketData.team.flagCode)}</span>
                <div>
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-2">{bracketData.team.name}</h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="bg-secondary px-3 py-1 rounded-full text-sm font-medium border border-border">
                      Group {bracketData.team.group}
                    </span>
                    <span className="bg-secondary px-3 py-1 rounded-full text-sm font-medium border border-border">
                      FIFA #{bracketData.team.fifaRanking}
                    </span>
                    <span className="bg-secondary px-3 py-1 rounded-full text-sm font-medium border border-border">
                      {bracketData.team.confederation}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-8 w-full md:w-auto">
                <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mb-2">Tournament Win Probability</p>
                <div className="text-5xl md:text-7xl font-bold font-mono text-primary flex items-center justify-center md:justify-end gap-3">
                  {(bracketData.tournamentWinProbability * 100).toFixed(1)}<span className="text-3xl md:text-4xl text-primary/50">%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 opacity-50">
                  Based on {bracketData.simulationsRun.toLocaleString()} simulations
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Path to the Final */}
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[2.25rem] md:before:ml-[50%] before:-translate-x-px md:before:-translate-x-px before:w-0.5 before:bg-gradient-to-b before:from-primary/20 before:via-primary/10 before:to-transparent before:-z-10">
            {bracketData.path.map((stage, index) => {
              const isFinal = stage.stage === "final";
              const isMuted = stage.reachProbability < 0.02;
              const hasHighWinProb = isFinal && bracketData.tournamentWinProbability > 0.2;
              
              return (
                <Card 
                  key={stage.stage} 
                  className={cn(
                    "bg-card border-border overflow-hidden relative transition-all duration-500",
                    isMuted ? "opacity-60 saturate-50 hover:opacity-100 hover:saturate-100" : "",
                    isFinal ? "border-primary/30 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.2)]" : ""
                  )}
                >
                  {isFinal && <div className="absolute inset-0 bg-primary/5 -z-10" />}
                  
                  <CardContent className="p-0 flex flex-col md:flex-row">
                    
                    {/* Left: Stage Info */}
                    <div className="p-6 md:p-8 md:w-2/5 border-b md:border-b-0 md:border-r border-border flex flex-col justify-center relative">
                      {isFinal && hasHighWinProb && (
                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-lg">
                          Strong Contender
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 mb-4">
                        {isFinal ? (
                          <div className="bg-primary/20 p-2 rounded-full text-primary">
                            <Trophy className="w-5 h-5" />
                          </div>
                        ) : (
                          <div className="bg-secondary p-2 rounded-full text-muted-foreground border border-border">
                            <Swords className="w-5 h-5" />
                          </div>
                        )}
                        <h3 className={cn("text-xl font-bold tracking-tight", isFinal ? "text-primary" : "text-foreground")}>
                          {stage.description}
                        </h3>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Reach Prob</span>
                          <span className="text-xl font-bold font-mono text-foreground">{(stage.reachProbability * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-1000 ease-out"
                            style={{ width: `${stage.reachProbability * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right: Opponents */}
                    <div className="p-6 md:p-8 md:w-3/5">
                      <h4 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Most Likely Opponents</h4>
                      
                      {stage.topOpponents.length > 0 ? (
                        <div className="space-y-3">
                          {stage.topOpponents.map((opp, oppIndex) => (
                            <div key={opp.team.id} className="flex items-center justify-between bg-secondary/30 p-3 rounded-lg border border-border/50 hover:bg-secondary/50 transition-colors">
                              
                              <div className="flex items-center gap-3 w-1/2">
                                <span className="text-2xl">{getFlagEmoji(opp.team.flagCode)}</span>
                                <span className="font-bold truncate">{opp.team.name}</span>
                              </div>
                              
                              <div className="flex items-center gap-6 w-1/2 justify-end text-right">
                                <div className="hidden sm:block">
                                  <div className="text-[10px] uppercase font-mono text-muted-foreground">Encounter</div>
                                  <div className="font-mono text-sm">{(opp.encounterProbability * 100).toFixed(1)}%</div>
                                </div>
                                <div>
                                  <div className="text-[10px] uppercase font-mono text-muted-foreground">Win Rate</div>
                                  <div className={cn("font-mono font-bold text-sm", opp.winProbabilityIfFacing > 0.5 ? "text-primary" : "text-destructive")}>
                                    {(opp.winProbabilityIfFacing * 100).toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                              
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm py-4">
                          No likely opponents found.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

        </div>
      ) : null}

    </div>
  )
}
