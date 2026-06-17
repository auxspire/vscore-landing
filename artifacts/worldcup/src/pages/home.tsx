import { useState } from "react"
import { useLocation, Link } from "wouter"
import { useGetTeams, useGetPopularMatchups } from "@workspace/api-client-react"
import { TeamCombobox } from "@/components/TeamCombobox"
import { Navbar } from "@/components/Navbar"
import { WorldCupFixturesStandingsPanel } from "@/components/WorldCupFixturesStandingsPanel"
import { LiveMetricsToggle } from "@/components/LiveMetricsToggle"
import { FaqSection, HOME_FAQ } from "@/components/FaqSection"
import { useLiveMetrics } from "@/hooks/useLiveMetrics"
import { useHomeTab, type HomeTab } from "@/hooks/useHomeTab"
import { publicAsset } from "@/lib/assets"
import { usePageSeo, PAGE_SEO } from "@/lib/seo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { getFlagEmoji, cn } from "@/lib/utils"
import {
  Swords, Activity, ArrowRight, GitBranch, Trophy,
  BarChart3, Zap, Target, ChevronRight, Calendar,
} from "lucide-react"

const TAB_META: Record<
  HomeTab,
  { label: string; shortLabel: string; icon: React.ReactNode }
> = {
  predictor: {
    label: "Match Predictor",
    shortLabel: "Predictor",
    icon: <Swords className="w-4 h-4" />,
  },
  path: {
    label: "Path to Final",
    shortLabel: "Path",
    icon: (
      <img
        src={publicAsset("wc26-sticker-path.png")}
        alt=""
        className="h-4 w-4 object-contain"
        width={16}
        height={16}
      />
    ),
  },
  fixtures: {
    label: "Fixtures & Standings",
    shortLabel: "Fixtures",
    icon: <Calendar className="w-4 h-4" />,
  },
}

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
    <div className="min-h-[100dvh] w-full flex flex-col">
      <Navbar />

      <div
        className={cn(
          "flex-1 pt-8 pb-24 px-4 md:px-8 mx-auto w-full relative z-10",
          tab === "fixtures" ? "max-w-6xl" : "max-w-5xl",
        )}
      >
        <header className="mb-8 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3.5 mb-5">
            <img
              src={publicAsset("wc26-sticker-matchup.png")}
              alt="VScor World Cup 2026"
              className="h-14 w-14 shrink-0 object-contain"
              width={56}
              height={56}
            />
            <div className="space-y-0.5 text-left">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight">
                VScor World Cup 2026 Hub
              </h1>
              <p className="text-base md:text-lg text-muted-foreground font-medium leading-snug">
                Predict matchups, explore paths to the final, and follow live fixtures
              </p>
            </div>
          </div>

          <div className="flex justify-center md:justify-start">
            <div className="inline-flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full text-xs font-mono font-medium tracking-wider text-primary border border-border">
              <Activity className="w-3 h-3" /> MONTE CARLO · LIVE FIXTURES · 48 TEAMS
            </div>
          </div>
        </header>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as HomeTab)}
          className="w-full"
        >
          <TabsList className="w-full h-auto p-1 grid grid-cols-3 gap-1 bg-secondary/40 mb-8">
            {(Object.keys(TAB_META) as HomeTab[]).map((key) => {
              const meta = TAB_META[key]
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-2 sm:px-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  {meta.icon}
                  <span className="sm:hidden">{meta.shortLabel}</span>
                  <span className="hidden sm:inline">{meta.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {/* ── Tab 1: Predictor ── */}
          <TabsContent value="predictor" className="mt-0 space-y-12 focus-visible:outline-none">
            <section id="predictor" className="scroll-mt-24">
              <h2 className="text-xl font-bold mb-2 tracking-tight">Matchup Predictor</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
                Pick two teams to see where they are most likely to meet — group stage through the final.
              </p>

              <div className="grid md:grid-cols-[1fr,auto,1fr] gap-6 items-center mb-10 relative">
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
                    onChange={(val) => { if (val !== teamA) setTeamB(val) }}
                    placeholder="Select opponent..."
                    disabled={isLoadingTeams}
                  />
                </div>
              </div>

              <div className="mb-6 max-w-xl mx-auto md:mx-0">
                <LiveMetricsToggle />
              </div>

              <div className="flex justify-center md:justify-start mb-4">
                <Button
                  size="lg"
                  className="h-14 px-10 text-base font-bold tracking-wide uppercase shadow-[0_0_40px_-10px_hsl(var(--primary))]"
                  disabled={!teamA || !teamB || teamA === teamB}
                  onClick={handlePredict}
                >
                  Run Simulation
                </Button>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-6 tracking-tight">Popular Matchups</h2>
              {isLoadingMatchups ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 bg-secondary/50 rounded-xl" />
                  ))}
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
                            <p className="text-sm font-medium mt-1">
                              Most likely:{" "}
                              <span className="capitalize text-foreground">
                                {matchup.mostLikelyStage.replace(/_/g, " ")}
                              </span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground uppercase font-mono tracking-wider mb-1">Probability</p>
                            <p className="text-xl font-bold font-mono text-primary">
                              {(matchup.totalProbability * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </TabsContent>

          {/* ── Tab 2: Path to Final ── */}
          <TabsContent value="path" className="mt-0 focus-visible:outline-none">
            <section id="path-to-final" className="scroll-mt-24">
              <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-background via-secondary/40 to-background shadow-[0_0_60px_-20px_hsl(var(--primary)/0.25)]">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[120px] -z-0 rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 blur-[80px] -z-0 rounded-full pointer-events-none" />

                <div className="relative z-10 p-8 md:p-12">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex-1 max-w-xl">
                      <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wider text-primary bg-primary/10 border border-primary/20">
                        <GitBranch className="w-3 h-3" /> PATH TO FINAL
                      </div>
                      <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4 text-foreground">
                        Explore Every Possible Path to Glory
                      </h2>
                      <p className="text-muted-foreground text-base leading-relaxed mb-6">
                        Pick any of the 48 nations and trace their complete bracket journey — stage by stage,
                        scenario by scenario. Explore tournament win probabilities, lock in opponents to model
                        specific matchups, and discover how group finish changes everything.
                      </p>

                      <div className="flex flex-wrap gap-2 mb-8">
                        {[
                          { icon: <GitBranch className="w-3 h-3" />, label: "Bracket Path Explorer" },
                          { icon: <Trophy className="w-3 h-3" />, label: "Win Probabilities" },
                          { icon: <Target className="w-3 h-3" />, label: "Scenario Locking" },
                          { icon: <Zap className="w-3 h-3" />, label: "10,000 Simulations" },
                          { icon: <BarChart3 className="w-3 h-3" />, label: "All 48 Teams" },
                        ].map(({ icon, label }) => (
                          <span
                            key={label}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/60 border border-border/60 text-xs font-mono text-muted-foreground"
                          >
                            {icon} {label}
                          </span>
                        ))}
                      </div>

                      <Link href="/bracket">
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest",
                            "bg-primary text-primary-foreground",
                            "shadow-[0_0_24px_-6px_hsl(var(--primary)/0.8)]",
                            "hover:shadow-[0_0_36px_-6px_hsl(var(--primary)/0.9)] hover:scale-[1.02]",
                            "active:scale-100 transition-all duration-200",
                            "border border-primary/60",
                          )}
                        >
                          <img
                            src={publicAsset("wc26-sticker-path.png")}
                            alt=""
                            className="h-6 w-6 object-contain"
                            width={24}
                            height={24}
                          />
                          Open Bracket Explorer
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </Link>
                    </div>

                    <div className="flex flex-col gap-3 md:w-56 flex-shrink-0">
                      {[
                        {
                          href: "/bracket",
                          icon: <GitBranch className="w-4 h-4 text-primary" />,
                          title: "Bracket Explorer",
                          desc: "Full path for any team",
                        },
                        {
                          href: "/rankings",
                          icon: <BarChart3 className="w-4 h-4 text-amber-400" />,
                          title: "Power Rankings",
                          desc: "All 48 teams ranked",
                        },
                      ].map(({ href, icon, title, desc }) => (
                        <Link key={href} href={href}>
                          <div
                            className={cn(
                              "flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-secondary/30",
                              "hover:border-primary/30 hover:bg-secondary/60 transition-all cursor-pointer group",
                            )}
                          >
                            <div className="p-2 rounded-lg bg-secondary border border-border/50 flex-shrink-0">
                              {icon}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                {title}
                              </div>
                              <div className="text-xs text-muted-foreground">{desc}</div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all ml-auto flex-shrink-0" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </TabsContent>

          {/* ── Tab 3: Fixtures & Standings ── */}
          <TabsContent value="fixtures" className="mt-0 focus-visible:outline-none">
            <section id="fixtures-standings" className="scroll-mt-24">
              <div className="mb-6">
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Fixtures &amp; Standings
                </h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                  Live match schedule, results, group tables, and top scorers — synced every 15 minutes.
                </p>
              </div>
              <WorldCupFixturesStandingsPanel variant="full" />
            </section>
          </TabsContent>
        </Tabs>

        <FaqSection items={HOME_FAQ} className="mt-16 mb-4" />
      </div>
    </div>
  )
}
