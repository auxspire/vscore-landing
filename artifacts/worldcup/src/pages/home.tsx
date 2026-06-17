import { useState } from "react"
import { useLocation } from "wouter"
import { useGetTeams, useGetPopularMatchups } from "@workspace/api-client-react"
import { TeamCombobox } from "@/components/TeamCombobox"
import { WorldCupLayout } from "@/components/WorldCupLayout"
import { WorldCupFixturesStandingsPanel } from "@/components/WorldCupFixturesStandingsPanel"
import { PathToFinalPanel } from "@/components/PathToFinalPanel"
import { LiveMetricsToggle } from "@/components/LiveMetricsToggle"
import { FaqSection, HOME_FAQ } from "@/components/FaqSection"
import { useLiveMetrics } from "@/hooks/useLiveMetrics"
import { useHomeTab, type HomeTab } from "@/hooks/useHomeTab"
import { publicAsset } from "@/lib/assets"
import { usePageSeo, PAGE_SEO } from "@/lib/seo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getFlagEmoji } from "@/lib/utils"
import { Swords, Activity, Calendar } from "lucide-react"

export default function Home() {
  const [, setLocation] = useLocation()
  const [teamA, setTeamA] = useState<string>("")
  const [teamB, setTeamB] = useState<string>("")
  const { tab, setTab } = useHomeTab()

  usePageSeo(PAGE_SEO.home)

  const { data: teams = [], isLoading: isLoadingTeams } = useGetTeams()
  const { data: popularMatchups = [], isLoading: isLoadingMatchups } = useGetPopularMatchups()
  const { queryFlag } = useLiveMetrics()

  const handlePredict = () => {
    if (teamA && teamB && teamA !== teamB) {
      const live = queryFlag ? `&useLiveMetrics=1` : ""
      setLocation(`/matchup?teamA=${teamA}&teamB=${teamB}${live}`)
    }
  }

  return (
    <WorldCupLayout
      activeTab={tab}
      hubMode="controlled"
      onHubTabChange={(t) => setTab(t as HomeTab)}
      wide={tab === "fixtures"}
      showHubTabs
    >
      <header className="mb-8 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-3.5 mb-4">
          <img
            src={publicAsset("wc26-sticker-matchup.png")}
            alt="VScor World Cup 2026"
            className="h-12 w-12 shrink-0 object-contain"
            width={48}
            height={48}
          />
          <div className="text-left">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
              VScor World Cup 2026
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-0.5">
              {tab === "predictor" && "Predict where any two teams will meet"}
              {tab === "path" && "Trace each nation's route to the final"}
              {tab === "fixtures" && "Today's matches, results, and group tables"}
            </p>
          </div>
        </div>
        <div className="flex justify-center md:justify-start">
          <div className="inline-flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full text-xs font-mono font-medium tracking-wider text-primary border border-border">
            <Activity className="w-3 h-3" /> MONTE CARLO · LIVE DATA · 48 TEAMS
          </div>
        </div>
      </header>

      {tab === "predictor" && (
        <div className="space-y-12 animate-in fade-in duration-300">
          <section id="predictor" className="scroll-mt-32">
            <div className="grid md:grid-cols-[1fr,auto,1fr] gap-6 items-center mb-8 relative">
              <div className="absolute inset-0 bg-primary/5 blur-[100px] -z-10 rounded-full" />
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-muted-foreground font-bold tracking-wider uppercase ml-1">Team 1</label>
                <TeamCombobox teams={teams} value={teamA} onChange={setTeamA} placeholder="Select first team…" disabled={isLoadingTeams} />
              </div>
              <div className="flex justify-center">
                <div className="bg-secondary text-muted-foreground rounded-full p-4 border border-border shadow-xl">
                  <Swords className="w-6 h-6" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-muted-foreground font-bold tracking-wider uppercase ml-1">Team 2</label>
                <TeamCombobox
                  teams={teams}
                  value={teamB}
                  onChange={(val) => { if (val !== teamA) setTeamB(val) }}
                  placeholder="Select opponent…"
                  disabled={isLoadingTeams}
                />
              </div>
            </div>
            <div className="mb-6 max-w-xl">
              <LiveMetricsToggle />
            </div>
            <Button
              size="lg"
              className="h-14 px-10 text-base font-bold tracking-wide uppercase shadow-[0_0_40px_-10px_hsl(var(--primary))]"
              disabled={!teamA || !teamB || teamA === teamB}
              onClick={handlePredict}
            >
              Run simulation
            </Button>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-4 tracking-tight">Popular matchups</h2>
            {isLoadingMatchups ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 bg-secondary/50 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {popularMatchups.map((matchup, i) => (
                  <Card
                    key={i}
                    className="bg-card hover:bg-secondary/50 transition-colors cursor-pointer border-border hover:border-primary/50 group"
                    onClick={() => setLocation(`/matchup?teamA=${matchup.teamA.id}&teamB=${matchup.teamB.id}`)}
                  >
                    <CardContent className="p-5">
                      <div className="flex justify-between items-center mb-3 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-2xl shrink-0">{getFlagEmoji(matchup.teamA.flagCode)}</span>
                          <span className="font-bold truncate">{matchup.teamA.name}</span>
                        </div>
                        <span className="text-muted-foreground text-xs font-bold shrink-0">vs</span>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold truncate">{matchup.teamB.name}</span>
                          <span className="text-2xl shrink-0">{getFlagEmoji(matchup.teamB.flagCode)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-end text-sm">
                        <p className="text-muted-foreground truncate">{matchup.label}</p>
                        <p className="font-mono font-bold text-primary shrink-0 ml-2">
                          {(matchup.totalProbability * 100).toFixed(1)}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === "path" && (
        <div className="animate-in fade-in duration-300">
          <PathToFinalPanel />
        </div>
      )}

      {tab === "fixtures" && (
        <div className="animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            <span>Matches shown in your local timezone · synced every 15 minutes</span>
          </div>
          <WorldCupFixturesStandingsPanel variant="full" />
        </div>
      )}

      <FaqSection items={HOME_FAQ} className="mt-16 mb-4" />
    </WorldCupLayout>
  )
}
