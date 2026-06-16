import { useMemo, useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import {
  ChevronDown,
  Calendar,
  Trophy,
  Users,
  Clock,
} from "lucide-react";
import { SyncStatusFooter } from "@/components/SyncStatusFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  useFootballFixtures,
  useFootballStandings,
  useFootballSyncJobs,
  useFootballTeams,
  isToday,
  isLive,
  aggregateTopScorers,
  type FootballFixture,
  type FootballStanding,
} from "@/hooks/useFootballData";

function formatKickoff(iso: string | null): string {
  if (!iso) return "TBD";
  try {
    const d = parseISO(iso);
    return isValid(d) ? format(d, "MMM d · HH:mm") : "TBD";
  } catch {
    return "TBD";
  }
}

function MatchRow({ f }: { f: FootballFixture }) {
  const live = isLive(f.time_elapsed);
  const kickoff = formatKickoff(f.kickoff_at);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 px-4 hover:bg-secondary/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">{f.home_team_name ?? "TBD"}</span>
          <span className="text-muted-foreground text-sm">
            {f.is_finished ? `${f.home_goals ?? 0} – ${f.away_goals ?? 0}` : "vs"}
          </span>
          <span className="font-medium truncate">{f.away_team_name ?? "TBD"}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
          <span>{kickoff}</span>
          {f.group_name && <span>Group {f.group_name}</span>}
          {f.match_type && f.match_type !== "group" && (
            <span className="uppercase">{f.match_type}</span>
          )}
        </div>
      </div>
      {live && (
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full shrink-0">
          Live
        </span>
      )}
    </div>
  );
}

function StandingsTable({
  group,
  rows,
  teamNameById,
}: {
  group: string;
  rows: FootballStanding[];
  teamNameById: Record<string, string>;
}) {
  const groupRows = rows.filter((r) => r.group_name === group);
  if (groupRows.length === 0) {
    return <p className="text-sm text-muted-foreground p-4">No standings available yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-[2rem,1fr,2rem,2rem,2rem,2rem,2rem,2rem,2.5rem] gap-1 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 min-w-[520px]">
        <span>#</span>
        <span>Team</span>
        <span className="text-center">P</span>
        <span className="text-center">W</span>
        <span className="text-center">D</span>
        <span className="text-center">L</span>
        <span className="text-center">GF</span>
        <span className="text-center">GA</span>
        <span className="text-center">Pts</span>
      </div>
      <div className="divide-y divide-border/20 min-w-[520px]">
        {groupRows.map((r) => (
          <div
            key={`${r.group_name}-${r.team_id}`}
            className="grid grid-cols-[2rem,1fr,2rem,2rem,2rem,2rem,2rem,2rem,2.5rem] gap-1 px-4 py-2.5 text-sm hover:bg-secondary/30 items-center"
          >
            <span className="text-muted-foreground font-mono text-xs">{r.rank ?? "–"}</span>
            <span className="font-medium truncate">{r.team_name ?? teamNameById[r.team_id] ?? r.team_id}</span>
            <span className="text-center text-muted-foreground">{r.played ?? "–"}</span>
            <span className="text-center text-muted-foreground">{r.won ?? "–"}</span>
            <span className="text-center text-muted-foreground">{r.drawn ?? "–"}</span>
            <span className="text-center text-muted-foreground">{r.lost ?? "–"}</span>
            <span className="text-center">{r.goals_for ?? "–"}</span>
            <span className="text-center">{r.goals_against ?? "–"}</span>
            <span className="text-center font-bold text-primary">{r.points ?? "–"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorldCupFixturesStandingsPanel() {
  const [open, setOpen] = useState(false);
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [activeGroup, setActiveGroup] = useState("A");

  const configured = isSupabaseConfigured();
  const { data: syncJobs = [], isLoading: syncLoading } = useFootballSyncJobs();
  const { data: fixtures = [], isLoading: fixturesLoading, isError: fixturesError } = useFootballFixtures();
  const { data: standings = [], isLoading: standingsLoading } = useFootballStandings();
  const { data: teams = [] } = useFootballTeams();

  const now = useMemo(() => new Date(), [fixtures]);

  const todayMatches = useMemo(
    () => fixtures.filter((f) => isToday(f.kickoff_at)),
    [fixtures],
  );

  const recentResults = useMemo(
    () =>
      fixtures
        .filter((f) => f.is_finished)
        .sort((a, b) => (b.kickoff_at ?? "").localeCompare(a.kickoff_at ?? ""))
        .slice(0, 8),
    [fixtures],
  );

  const upcomingForTeam = useMemo(() => {
    if (!teamFilter) return [];
    return fixtures
      .filter(
        (f) =>
          !f.is_finished &&
          f.kickoff_at &&
          new Date(f.kickoff_at) >= now &&
          (f.home_team_id === teamFilter || f.away_team_id === teamFilter),
      )
      .slice(0, 5);
  }, [fixtures, teamFilter, now]);

  const topScorers = useMemo(() => aggregateTopScorers(fixtures), [fixtures]);

  const groups = useMemo(() => {
    const set = new Set(standings.map((s) => s.group_name));
    return [...set].sort();
  }, [standings]);

  const teamNameById = useMemo(
    () => Object.fromEntries(teams.map((t) => [t.api_team_id, t.name_en])),
    [teams],
  );

  const loading = syncLoading || fixturesLoading || standingsLoading;

  return (
    <section className="mb-12 scroll-mt-24">
      <Card className="bg-card border-border shadow-lg overflow-hidden">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="py-4 px-4 md:px-6 border-b border-border/50 bg-secondary/20 flex flex-row items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors">
              <div className="text-left">
                <h2 className="text-lg font-bold tracking-tight">Fixtures &amp; Current Standings</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Live World Cup schedule, results, and group tables
                </p>
              </div>
              <ChevronDown
                className={cn("w-5 h-5 text-muted-foreground transition-transform shrink-0", open && "rotate-180")}
              />
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="p-0">
              {!configured && (
                <p className="text-sm text-muted-foreground p-6 text-center">
                  Live data unavailable — Supabase is not configured for this build.
                </p>
              )}

              {configured && loading && (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-12 w-full bg-secondary/50" />
                  <Skeleton className="h-24 w-full bg-secondary/50" />
                  <Skeleton className="h-24 w-full bg-secondary/50" />
                </div>
              )}

              {configured && !loading && fixturesError && (
                <p className="text-sm text-muted-foreground p-6 text-center">
                  Could not load synced data. Try again later.
                </p>
              )}

              {configured && !loading && !fixturesError && (
                <Tabs defaultValue="today" className="w-full">
                  <div className="px-4 pt-4 overflow-x-auto">
                    <TabsList className="w-max min-w-full justify-start bg-secondary/30">
                      <TabsTrigger value="today" className="gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Today
                      </TabsTrigger>
                      <TabsTrigger value="schedule" className="gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Team schedule
                      </TabsTrigger>
                      <TabsTrigger value="standings" className="gap-1.5">
                        <Trophy className="w-3.5 h-3.5" /> Standings
                      </TabsTrigger>
                      <TabsTrigger value="results" className="gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Results
                      </TabsTrigger>
                      <TabsTrigger value="scorers" className="gap-1.5">
                        Scorers
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="today" className="mt-0">
                    {todayMatches.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-6 text-center">
                        No matches scheduled for today.
                      </p>
                    ) : (
                      <div className="divide-y divide-border/20">
                        {todayMatches.map((f) => (
                          <MatchRow key={f.api_fixture_id} f={f} />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="schedule" className="p-4 space-y-4">
                    <Select value={teamFilter} onValueChange={setTeamFilter}>
                      <SelectTrigger className="max-w-xs bg-secondary/30">
                        <SelectValue placeholder="Select a team…" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((t) => (
                          <SelectItem key={t.api_team_id} value={t.api_team_id}>
                            {t.name_en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!teamFilter && (
                      <p className="text-sm text-muted-foreground">Choose a team to see upcoming fixtures.</p>
                    )}
                    {teamFilter && upcomingForTeam.length === 0 && (
                      <p className="text-sm text-muted-foreground">No upcoming synced fixtures for this team.</p>
                    )}
                    <div className="divide-y divide-border/20 rounded-xl border border-border overflow-hidden">
                      {upcomingForTeam.map((f) => (
                        <MatchRow key={f.api_fixture_id} f={f} />
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="standings" className="mt-0 pb-2">
                    {standings.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-6 text-center">
                        No standings available yet.
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-1.5 px-4 py-3 border-b border-border/30">
                          {(groups.length ? groups : "ABCDEFGHIJKL".split("")).map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setActiveGroup(g)}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors",
                                activeGroup === g
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "border-border text-muted-foreground hover:border-primary/50",
                              )}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                        <StandingsTable group={activeGroup} rows={standings} teamNameById={teamNameById} />
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="results" className="mt-0">
                    {recentResults.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-6 text-center">
                        No synced fixtures yet. Run football data sync.
                      </p>
                    ) : (
                      <div className="divide-y divide-border/20">
                        {recentResults.map((f) => (
                          <MatchRow key={f.api_fixture_id} f={f} />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="scorers" className="p-4">
                    {topScorers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No scorer data yet — available after matches finish.
                      </p>
                    ) : (
                      <div className="divide-y divide-border/20 rounded-xl border border-border overflow-hidden">
                        {topScorers.map((s, i) => (
                          <div
                            key={`${s.name}-${i}`}
                            className="flex items-center justify-between px-4 py-2.5 hover:bg-secondary/30"
                          >
                            <div>
                              <span className="font-medium">{s.name}</span>
                              {s.teamName && (
                                <span className="text-xs text-muted-foreground ml-2">{s.teamName}</span>
                              )}
                            </div>
                            <span className="font-mono font-bold text-primary">{s.goals}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}

              <SyncStatusFooter jobs={syncJobs} isLoading={syncLoading} />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </section>
  );
}
