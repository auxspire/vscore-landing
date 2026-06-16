import { useEffect, useState } from "react"
import { useLocation, useSearch, Link } from "wouter"
import { useGetMatchProbability, getGetMatchProbabilityQueryKey, useGetTeamStageBreakdown, getGetTeamStageBreakdownQueryKey } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { LoadingAnimation } from "@/components/LoadingAnimation"
import { ProbabilityBar } from "@/components/ProbabilityBar"
import { Navbar } from "@/components/Navbar"
import { getFlagEmoji, cn } from "@/lib/utils"
import { usePageSeo, matchupSeo, PAGE_SEO, WORLDCUP_BASE } from "@/lib/seo"
import { SharePredictionButton } from "@/components/SharePredictionButton"
import { buildMatchupShareMessage } from "@/lib/share-messages"
import { LiveMetricsToggle } from "@/components/LiveMetricsToggle"
import { useLiveMetricsFromUrl } from "@/hooks/useLiveMetrics"
import { ArrowLeft, AlertTriangle, RefreshCcw, Activity, GitBranch } from "lucide-react"

export default function Matchup() {
  const [, setLocation] = useLocation()
  const search = useSearch()

  // Parse query params from wouter (SPA-safe)
  const searchParams = new URLSearchParams(search)
  const teamA = searchParams.get("teamA")
  const teamB = searchParams.get("teamB")
  const { queryFlag } = useLiveMetricsFromUrl(search)

  // Redirect to home if no teams provided — must be in useEffect to avoid render-time side effects
  useEffect(() => {
    if (!teamA || !teamB) {
      setLocation("/")
    }
  }, [teamA, teamB, setLocation])

  const { data: matchResult, isLoading: isLoadingMatch } = useGetMatchProbability(
    { teamA: teamA ?? "", teamB: teamB ?? "", useLiveMetrics: queryFlag },
    {
      query: {
        enabled: !!teamA && !!teamB,
        queryKey: getGetMatchProbabilityQueryKey({
          teamA: teamA ?? "",
          teamB: teamB ?? "",
          useLiveMetrics: queryFlag,
        }),
      },
    },
  )

  usePageSeo(
    teamA && teamB
      ? matchResult
        ? matchupSeo(matchResult.teamA.name, matchResult.teamB.name, matchResult.totalProbability)
        : matchupSeo(teamA, teamB)
      : PAGE_SEO.home,
  )

  const { data: teamABreakdown, isLoading: isLoadingBreakdownA } = useGetTeamStageBreakdown(
    teamA ?? "",
    { useLiveMetrics: queryFlag },
    { query: { enabled: !!teamA, queryKey: getGetTeamStageBreakdownQueryKey(teamA ?? "", { useLiveMetrics: queryFlag }) } },
  )

  const { data: teamBBreakdown, isLoading: isLoadingBreakdownB } = useGetTeamStageBreakdown(
    teamB ?? "",
    { useLiveMetrics: queryFlag },
    { query: { enabled: !!teamB, queryKey: getGetTeamStageBreakdownQueryKey(teamB ?? "", { useLiveMetrics: queryFlag }) } },
  )

  const [animated, setAnimated] = useState(false)
  useEffect(() => {
    if (matchResult) {
      setTimeout(() => setAnimated(true), 100)
    }
  }, [matchResult])

  if (!teamA || !teamB) return null

  const matchupShare = matchResult
    ? buildMatchupShareMessage({
        teamA: matchResult.teamA.name,
        teamB: matchResult.teamB.name,
        totalProbability: matchResult.totalProbability,
        stages: matchResult.stages,
        simulationsRun: matchResult.simulationsRun,
        sameGroup: matchResult.sameGroup,
        useLiveMetrics: !!queryFlag,
        shareUrl: `${WORLDCUP_BASE}/matchup?teamA=${matchResult.teamA.id}&teamB=${matchResult.teamB.id}${queryFlag ? "&useLiveMetrics=1" : ""}`,
      })
    : null

  return (
    <div className="min-h-[100dvh] w-full flex flex-col">
      <Navbar />
      <div className="flex-1 pt-8 pb-24 px-4 md:px-8 max-w-6xl mx-auto w-full">
      <Button 
        variant="ghost" 
        className="mb-8 pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground group"
        onClick={() => setLocation("/")}
      >
        <ArrowLeft className="mr-2 w-4 h-4 transition-transform group-hover:-translate-x-1" />
        New Prediction
      </Button>

      {isLoadingMatch ? (
        <LoadingAnimation message="Running simulations" />
      ) : matchResult ? (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Header */}
          <div className="text-center relative">
            <div className="absolute inset-0 bg-primary/5 blur-[100px] -z-10 rounded-full" />
            <div className="flex justify-center items-center gap-4 md:gap-12 mb-6">
              <div className="flex flex-col items-center">
                <Link href={`/bracket?team=${matchResult.teamA.id}`} title="View bracket path">
                  <span className="text-6xl md:text-8xl drop-shadow-lg cursor-pointer hover:scale-110 transition-transform inline-block">{getFlagEmoji(matchResult.teamA.flagCode)}</span>
                </Link>
                <h2 className="text-xl md:text-3xl font-bold mt-4 tracking-tight">{matchResult.teamA.name}</h2>
                <span className="text-sm font-mono text-muted-foreground mt-1 tracking-wider">Group {matchResult.teamA.group}</span>
              </div>
              <div className="text-xl md:text-2xl font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 bg-secondary rounded-full border border-border">
                VS
              </div>
              <div className="flex flex-col items-center">
                <Link href={`/bracket?team=${matchResult.teamB.id}`} title="View bracket path">
                  <span className="text-6xl md:text-8xl drop-shadow-lg cursor-pointer hover:scale-110 transition-transform inline-block">{getFlagEmoji(matchResult.teamB.flagCode)}</span>
                </Link>
                <h2 className="text-xl md:text-3xl font-bold mt-4 tracking-tight">{matchResult.teamB.name}</h2>
                <span className="text-sm font-mono text-muted-foreground mt-1 tracking-wider">Group {matchResult.teamB.group}</span>
              </div>
            </div>

            <div className="inline-block mt-8 bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              <p className="text-sm font-mono text-muted-foreground tracking-wider uppercase mb-2">Overall Meeting Probability</p>
              <p className="text-5xl md:text-7xl font-bold font-mono text-primary tracking-tighter">
                {(matchResult.totalProbability * 100).toFixed(1)}<span className="text-3xl md:text-5xl text-muted-foreground">%</span>
              </p>
            </div>
            
            {matchResult.sameGroup && (
              <div className="mt-8 inline-flex items-center gap-2 bg-destructive/10 text-destructive border border-destructive/20 px-4 py-2 rounded-lg text-sm font-medium">
                <AlertTriangle className="w-4 h-4" />
                Teams are in the same group (Guaranteed group stage meeting)
              </div>
            )}

            <div className="mt-8 flex flex-col items-center gap-4 max-w-md mx-auto">
              <LiveMetricsToggle className="w-full text-left" />
              {matchupShare && (
                <SharePredictionButton
                  title={matchupShare.title}
                  text={matchupShare.text}
                  url={matchupShare.url}
                />
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr,350px] gap-8">
            
            {/* Main Stage Breakdown */}
            <Card className="bg-card border-border shadow-lg">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Stage-by-Stage Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-8">
                {matchResult.stages.map((stage, i) => (
                  <ProbabilityBar 
                    key={stage.stage} 
                    label={stage.stage} 
                    probability={stage.probability} 
                    description={stage.description}
                    colorClass={i === matchResult.stages.length - 1 ? "bg-primary shadow-[0_0_15px_hsl(var(--primary))]" : "bg-primary"}
                    animate={animated}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Individual Team Trajectories */}
            <div className="space-y-6">
              {[
                { data: teamABreakdown, isLoading: isLoadingBreakdownA, team: matchResult.teamA },
                { data: teamBBreakdown, isLoading: isLoadingBreakdownB, team: matchResult.teamB }
              ].map((breakdown, idx) => (
                <Card key={idx} className="bg-card border-border">
                  <CardHeader className="pb-3 border-b border-border/50 bg-secondary/20">
                    <CardTitle className="text-sm font-bold tracking-wide uppercase flex items-center gap-2">
                      <span className="text-xl">{getFlagEmoji(breakdown.team.flagCode)}</span>
                      {breakdown.team.name} Trajectory
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {breakdown.isLoading ? (
                      <div className="space-y-3">
                        {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-4 w-full bg-secondary" />)}
                      </div>
                    ) : breakdown.data ? (
                      <>
                        {breakdown.data.stages.map(stage => (
                          <div key={stage.stage} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground capitalize">{stage.stage.replace(/_/g, ' ')}</span>
                              <span className="font-mono">{(stage.probability * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full rounded-full transition-all duration-1000", idx === 0 ? "bg-white" : "bg-muted-foreground")}
                                style={{ width: `${Math.max(0.5, stage.probability * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                        <Link
                          href={`/bracket?team=${breakdown.team.id}`}
                          className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors"
                        >
                          <GitBranch className="w-3 h-3" /> View Bracket Path
                        </Link>
                      </>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>

          </div>

          <div className="flex justify-center pt-8">
            <Button 
              size="lg" 
              variant="outline" 
              className="gap-2 font-bold tracking-wider uppercase bg-secondary/50 hover:bg-secondary border-border"
              onClick={() => setLocation("/")}
            >
              <RefreshCcw className="w-4 h-4" /> Try Another Matchup
            </Button>
          </div>

        </div>
      ) : null}
      </div>
    </div>
  )
}
