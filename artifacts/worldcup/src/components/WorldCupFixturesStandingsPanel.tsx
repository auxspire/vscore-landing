import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Calendar,
  Trophy,
  ChevronRight,
  ChevronDown,
  Radio,
  LayoutGrid,
  List,
  Clock,
} from "lucide-react";
import { SyncStatusFooter } from "@/components/SyncStatusFooter";
import { FootballTeamSelect } from "@/components/FootballTeamSelect";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn, getFlagEmoji } from "@/lib/utils";
import {
  formatKickoffTime,
  getTimezoneLabel,
  getVisitorTimezone,
  parseKickoffUtc,
} from "@/lib/match-datetime";
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
  type FootballTeam,
  type ScorerEntry,
} from "@/hooks/useFootballData";

const QUALIFYING_SPOTS = 2;

function teamFlag(teamId: string | null, teams: FootballTeam[], size = "text-xl") {
  if (!teamId) return <span className={cn(size, "opacity-40")}>🏳️</span>;
  const team = teams.find((t) => t.api_team_id === teamId);
  if (team?.flag_url) {
    return (
      <img
        src={team.flag_url}
        alt=""
        className="h-6 w-6 rounded-sm object-cover shrink-0"
        width={24}
        height={24}
      />
    );
  }
  if (team?.fifa_code) {
    return <span className={cn(size, "leading-none shrink-0")}>{getFlagEmoji(team.fifa_code)}</span>;
  }
  return <span className={cn(size, "opacity-40")}>🏳️</span>;
}

function MatchCard({
  f,
  teams,
  timeZone,
}: {
  f: FootballFixture;
  teams: FootballTeam[];
  timeZone: string;
}) {
  const finished = f.is_finished;
  const live = !finished && isLive(f.time_elapsed);
  const kickoffTime = formatKickoffTime(f.kickoff_at, timeZone, { withTimezone: true });
  const kickoffTimeShort = formatKickoffTime(f.kickoff_at, timeZone);

  return (
    <article className="px-4 py-4 hover:bg-secondary/30 transition-colors border-b border-border/20 last:border-0">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {f.group_name && (
            <span className="px-2 py-0.5 rounded-md bg-secondary/60 border border-border/50 font-mono uppercase tracking-wider">
              Group {f.group_name}
            </span>
          )}
          {f.match_type && f.match_type !== "group" && (
            <span className="uppercase tracking-wider">{f.match_type.replace(/_/g, " ")}</span>
          )}
        </div>
        {live ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <Radio className="w-3 h-3 animate-pulse" />
            Live{f.time_elapsed ? ` · ${f.time_elapsed}'` : ""}
          </span>
        ) : finished ? (
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">FT</span>
        ) : (
          <span className="text-xs text-muted-foreground">{kickoffTime}</span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-3 items-center min-w-0">
        <div className="flex items-center justify-end gap-1.5 sm:gap-2 min-w-0">
          <span className="font-semibold text-xs sm:text-sm md:text-base truncate text-right">
            {f.home_team_name ?? "TBD"}
          </span>
          {teamFlag(f.home_team_id, teams)}
        </div>

        <div className="flex flex-col items-center justify-center min-w-[3.5rem] sm:min-w-[4.5rem] px-1 sm:px-2">
          {finished || live ? (
            <span
              className={cn(
                "text-xl md:text-2xl font-mono font-bold tabular-nums",
                live && "text-primary",
              )}
            >
              {f.home_goals ?? 0}
              <span className="text-muted-foreground mx-1.5 font-normal">–</span>
              {f.away_goals ?? 0}
            </span>
          ) : (
            <>
              <span className="text-lg font-mono font-bold text-muted-foreground">{kickoffTimeShort}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                Kickoff · {getTimezoneLabel(timeZone)}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {teamFlag(f.away_team_id, teams)}
          <span className="font-semibold text-xs sm:text-sm md:text-base truncate">
            {f.away_team_name ?? "TBD"}
          </span>
        </div>
      </div>
    </article>
  );
}

function RecentResultsBlock({
  results,
  teams,
  timeZone,
  title = "Recent results",
  limit = 5,
  defaultCollapsed = false,
  collapsible = true,
}: {
  results: FootballFixture[];
  teams: FootballTeam[];
  timeZone: string;
  title?: string;
  limit?: number;
  defaultCollapsed?: boolean;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(collapsible ? !defaultCollapsed : true);
  const slice = results.slice(0, limit);

  if (slice.length === 0) return null;

  const header = (
    <span className="flex items-center gap-2 min-w-0">
      <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </span>
      <span className="text-[10px] font-mono text-muted-foreground/70 tabular-nums">
        ({slice.length})
      </span>
    </span>
  );

  if (!collapsible) {
    return (
      <div className="min-w-0">
        <div className="px-4 py-2.5 flex items-center border-b border-border/20 bg-secondary/10">
          {header}
        </div>
        <div>
          {slice.map((f) => (
            <MatchCard key={f.api_fixture_id} f={f} teams={teams} timeZone={timeZone} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border/30 bg-secondary/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-2.5 flex items-center justify-between gap-2 border-b border-border/20 hover:bg-secondary/30 transition-colors text-left"
        aria-expanded={open}
      >
        {header}
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div>
          {slice.map((f) => (
            <MatchCard key={f.api_fixture_id} f={f} teams={teams} timeZone={timeZone} />
          ))}
        </div>
      )}
    </div>
  );
}

function TopScorersList({ scorers, teams }: { scorers: ScorerEntry[]; teams: FootballTeam[] }) {
  if (scorers.length === 0) return null;

  const teamByName = Object.fromEntries(teams.map((t) => [t.name_en.toLowerCase(), t]));

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="grid grid-cols-[2.5rem,1fr,auto] gap-2 px-4 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 bg-secondary/20">
        <span>#</span>
        <span>Player</span>
        <span className="text-right">Goals</span>
      </div>
      <div className="divide-y divide-border/15">
        {scorers.map((s, i) => {
          const team = s.teamName ? teamByName[s.teamName.toLowerCase()] : undefined;
          const rank = i + 1;
          return (
            <div
              key={`${s.name}-${s.teamName ?? ""}-${i}`}
              className="grid grid-cols-[2.5rem,1fr,auto] gap-2 items-center px-4 py-3 hover:bg-secondary/30"
            >
              <span
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold",
                  rank === 1 && "bg-primary/20 text-primary",
                  rank === 2 && "bg-secondary text-foreground",
                  rank === 3 && "bg-secondary text-amber-400/90",
                  rank > 3 && "text-muted-foreground",
                )}
              >
                {rank}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{s.name}</p>
                {s.teamName && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
                    {team?.fifa_code ? (
                      <span className="text-base leading-none shrink-0">{getFlagEmoji(team.fifa_code)}</span>
                    ) : null}
                    <span className="truncate">{s.teamName}</span>
                  </p>
                )}
              </div>
              <span className="inline-flex min-w-[2rem] justify-center px-2.5 py-1 rounded-full bg-primary/10 text-primary font-mono font-bold text-sm tabular-nums">
                {s.goals}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GroupStandingsCard({
  group,
  rows,
  teamNameById,
  teams,
}: {
  group: string;
  rows: FootballStanding[];
  teamNameById: Record<string, string>;
  teams: FootballTeam[];
}) {
  const groupRows = [...rows.filter((r) => r.group_name === group)].sort(
    (a, b) => (a.rank ?? 99) - (b.rank ?? 99),
  );

  if (groupRows.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/40 bg-secondary/25">
        <span className="font-bold text-sm tracking-tight">Group {group}</span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Top {QUALIFYING_SPOTS} advance
        </span>
      </div>
      <div className="divide-y divide-border/15">
        {groupRows.map((r) => {
          const qualifies = (r.rank ?? 99) <= QUALIFYING_SPOTS;
          const gd = r.goal_difference ?? (r.goals_for ?? 0) - (r.goals_against ?? 0);
          const name = r.team_name ?? teamNameById[r.team_id] ?? r.team_id;

          return (
            <div
              key={`${r.group_name}-${r.team_id}`}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5",
                qualifies && "bg-primary/[0.06] border-l-2 border-primary",
              )}
            >
              <span
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0",
                  qualifies ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground",
                )}
              >
                {r.rank ?? "–"}
              </span>
              {teamFlag(r.team_id, teams, "text-lg")}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {r.played ?? 0} played · {r.won ?? 0}W {r.drawn ?? 0}D {r.lost ?? 0}L
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-primary tabular-nums">{r.points ?? 0}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pts</p>
              </div>
              <div className="text-right w-10 shrink-0">
                <p
                  className={cn(
                    "text-sm font-mono font-medium tabular-nums",
                    gd > 0 && "text-emerald-400",
                    gd < 0 && "text-red-400/90",
                    gd === 0 && "text-muted-foreground",
                  )}
                >
                  {gd > 0 ? `+${gd}` : gd}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">GD</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StandingsTableView({
  group,
  rows,
  teamNameById,
  teams,
}: {
  group: string;
  rows: FootballStanding[];
  teamNameById: Record<string, string>;
  teams: FootballTeam[];
}) {
  const groupRows = [...rows.filter((r) => r.group_name === group)].sort(
    (a, b) => (a.rank ?? 99) - (b.rank ?? 99),
  );

  if (groupRows.length === 0) {
    return <p className="text-sm text-muted-foreground p-6 text-center">No standings for Group {group} yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border/50 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            <th className="py-3 pl-4 pr-2 text-left w-10">#</th>
            <th className="py-3 px-2 text-left">Team</th>
            <th className="py-3 px-2 text-center" title="Played">Pl</th>
            <th className="py-3 px-2 text-center" title="Won">W</th>
            <th className="py-3 px-2 text-center" title="Drawn">D</th>
            <th className="py-3 px-2 text-center" title="Lost">L</th>
            <th className="py-3 px-2 text-center" title="Goals for">GF</th>
            <th className="py-3 px-2 text-center" title="Goals against">GA</th>
            <th className="py-3 px-2 text-center" title="Goal difference">GD</th>
            <th className="py-3 pr-4 pl-2 text-center font-bold text-foreground">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/20">
          {groupRows.map((r) => {
            const qualifies = (r.rank ?? 99) <= QUALIFYING_SPOTS;
            const gd = r.goal_difference ?? (r.goals_for ?? 0) - (r.goals_against ?? 0);
            const name = r.team_name ?? teamNameById[r.team_id] ?? r.team_id;

            return (
              <tr
                key={`${r.group_name}-${r.team_id}`}
                className={cn("hover:bg-secondary/30", qualifies && "bg-primary/[0.04]")}
              >
                <td className="py-3 pl-4 pr-2">
                  <span
                    className={cn(
                      "inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-mono font-bold",
                      qualifies ? "bg-primary/15 text-primary" : "text-muted-foreground",
                    )}
                  >
                    {r.rank ?? "–"}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {teamFlag(r.team_id, teams, "text-lg")}
                    <span className="font-medium truncate">{name}</span>
                    {qualifies && (
                      <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-wider text-primary/80 shrink-0">
                        Qualifies
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2 text-center text-muted-foreground tabular-nums">{r.played ?? "–"}</td>
                <td className="py-3 px-2 text-center text-muted-foreground tabular-nums">{r.won ?? "–"}</td>
                <td className="py-3 px-2 text-center text-muted-foreground tabular-nums">{r.drawn ?? "–"}</td>
                <td className="py-3 px-2 text-center text-muted-foreground tabular-nums">{r.lost ?? "–"}</td>
                <td className="py-3 px-2 text-center tabular-nums">{r.goals_for ?? "–"}</td>
                <td className="py-3 px-2 text-center tabular-nums">{r.goals_against ?? "–"}</td>
                <td
                  className={cn(
                    "py-3 px-2 text-center font-mono tabular-nums",
                    gd > 0 && "text-emerald-400",
                    gd < 0 && "text-red-400/90",
                  )}
                >
                  {gd > 0 ? `+${gd}` : gd}
                </td>
                <td className="py-3 pr-4 pl-2 text-center font-bold text-primary tabular-nums">{r.points ?? "–"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type PanelVariant = "full" | "teaser";

type ScheduleView = "today" | "upcoming" | "results" | "team";
type DataSection = "matches" | "tables" | "scorers";

export function WorldCupFixturesStandingsPanel({ variant = "full" }: { variant?: PanelVariant }) {
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [activeGroup, setActiveGroup] = useState("A");
  const [standingsView, setStandingsView] = useState<"grid" | "table">("grid");
  const [dataSection, setDataSection] = useState<DataSection>("matches");
  const [scheduleView, setScheduleView] = useState<ScheduleView>("today");

  const configured = isSupabaseConfigured();
  const { data: syncJobs = [], isLoading: syncLoading } = useFootballSyncJobs();
  const { data: fixtures = [], isLoading: fixturesLoading, isError: fixturesError } = useFootballFixtures();
  const { data: standings = [], isLoading: standingsLoading } = useFootballStandings();
  const { data: teams = [] } = useFootballTeams();

  const timeZone = useMemo(() => getVisitorTimezone(), []);
  const tzLabel = useMemo(() => getTimezoneLabel(timeZone), [timeZone]);
  const now = useMemo(() => new Date(), [fixtures]);

  const todayMatches = useMemo(
    () => fixtures.filter((f) => isToday(f.kickoff_at, timeZone)),
    [fixtures, timeZone],
  );

  const liveMatches = useMemo(
    () => fixtures.filter((f) => isLive(f.time_elapsed)),
    [fixtures],
  );

  const upcomingMatches = useMemo(
    () =>
      fixtures
        .filter((f) => {
          if (f.is_finished) return false;
          const kickoff = parseKickoffUtc(f.kickoff_at);
          return kickoff != null && kickoff >= now;
        })
        .slice(0, variant === "teaser" ? 3 : 30),
    [fixtures, now, variant],
  );

  const recentResults = useMemo(
    () =>
      fixtures
        .filter((f) => f.is_finished)
        .sort((a, b) => (b.kickoff_at ?? "").localeCompare(a.kickoff_at ?? "")),
    [fixtures],
  );

  const recentResultsPreview = useMemo(
    () => recentResults.slice(0, variant === "teaser" ? 3 : 8),
    [recentResults, variant],
  );

  const upcomingForTeam = useMemo(() => {
    if (!teamFilter) return [];
    return fixtures
      .filter((f) => {
        if (f.is_finished) return false;
        const kickoff = parseKickoffUtc(f.kickoff_at);
        if (!kickoff || kickoff < now) return false;
        return f.home_team_id === teamFilter || f.away_team_id === teamFilter;
      })
      .slice(0, 8);
  }, [fixtures, teamFilter, now]);

  const recentForTeam = useMemo(() => {
    if (!teamFilter) return [];
    return fixtures
      .filter(
        (f) =>
          f.is_finished &&
          (f.home_team_id === teamFilter || f.away_team_id === teamFilter),
      )
      .sort((a, b) => (b.kickoff_at ?? "").localeCompare(a.kickoff_at ?? ""))
      .slice(0, 6);
  }, [fixtures, teamFilter]);

  const topScorers = useMemo(() => aggregateTopScorers(fixtures), [fixtures]);

  const groups = useMemo(() => {
    const set = new Set(standings.map((s) => s.group_name));
    return [...set].sort();
  }, [standings]);

  const groupsWithStandings = useMemo(
    () => groups.filter((g) => standings.some((s) => s.group_name === g)),
    [groups, standings],
  );

  useEffect(() => {
    if (groupsWithStandings.length > 0 && !groupsWithStandings.includes(activeGroup)) {
      setActiveGroup(groupsWithStandings[0]);
    }
  }, [groupsWithStandings, activeGroup]);

  const teamNameById = useMemo(
    () => Object.fromEntries(teams.map((t) => [t.api_team_id, t.name_en])),
    [teams],
  );

  const loading = syncLoading || fixturesLoading || standingsLoading;

  const todayUpcoming = useMemo(
    () => todayMatches.filter((f) => !f.is_finished && !isLive(f.time_elapsed)),
    [todayMatches],
  );

  /** Finished matches for Today view — shown in collapsed recent block so live/upcoming stay on top */
  const todayCollapsedResults = useMemo(() => {
    const shown = new Set([
      ...liveMatches.map((f) => f.api_fixture_id),
      ...todayUpcoming.map((f) => f.api_fixture_id),
    ]);
    return recentResults.filter((f) => !shown.has(f.api_fixture_id)).slice(0, 8);
  }, [recentResults, liveMatches, todayUpcoming]);

  if (variant === "teaser") {
    const preview =
      liveMatches.length > 0
        ? liveMatches
        : todayMatches.length > 0
          ? todayMatches
          : upcomingMatches.length > 0
            ? upcomingMatches
            : recentResultsPreview;
    const teaserShowsRecentOnly =
      liveMatches.length === 0 && todayMatches.length === 0 && upcomingMatches.length === 0;

    return (
      <section id="fixtures-standings" className="mb-12 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Fixtures &amp; Standings</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Live schedule, results, and group tables synced from World Cup 2026 data.
              <span className="block text-xs mt-1 font-mono text-muted-foreground/80">
                Kickoff times in {tzLabel}
              </span>
            </p>
          </div>
          <Link href="/?tab=fixtures">
            <Button variant="outline" className="gap-2 shrink-0 border-primary/30 hover:border-primary/60">
              View all <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <Card className="bg-card border-border shadow-lg overflow-hidden">
          <CardContent className="p-0">
            {!configured && (
              <p className="text-sm text-muted-foreground p-6 text-center">
                Live data unavailable — Supabase is not configured for this build.
              </p>
            )}

            {configured && loading && (
              <div className="p-6 space-y-3">
                <Skeleton className="h-16 w-full bg-secondary/50" />
                <Skeleton className="h-16 w-full bg-secondary/50" />
              </div>
            )}

            {configured && !loading && !fixturesError && (
              <>
                {preview.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-6 text-center">No fixtures synced yet.</p>
                ) : (
                  <div>
                    {preview.slice(0, 3).map((f) => (
                      <MatchCard key={f.api_fixture_id} f={f} teams={teams} timeZone={timeZone} />
                    ))}
                  </div>
                )}
                {recentResultsPreview.length > 0 && !teaserShowsRecentOnly && (
                  <RecentResultsBlock
                    results={recentResultsPreview}
                    teams={teams}
                    timeZone={timeZone}
                    title="Recent results"
                    limit={4}
                    defaultCollapsed
                  />
                )}
                {groups.length > 0 && (
                  <div className="p-4 border-t border-border/30 bg-secondary/10">
                    <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
                      Group standings snapshot
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {groupsWithStandings.slice(0, 2).map((g) => (
                        <GroupStandingsCard
                          key={g}
                          group={g}
                          rows={standings}
                          teamNameById={teamNameById}
                          teams={teams}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section id="fixtures-standings" className="scroll-mt-32">
      <Card className="bg-card border-border shadow-lg overflow-hidden">
        <CardHeader className="py-4 px-4 md:px-6 border-b border-border/50 bg-secondary/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Kickoff times in <span className="font-mono text-foreground/90">{tzLabel}</span>
            </p>
            {liveMatches.length > 0 && (
              <span className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/25">
                <Radio className="w-3 h-3 animate-pulse" />
                {liveMatches.length} live now
              </span>
            )}
          </div>
        </CardHeader>

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
            <>
              {/* Primary: Matches | Tables | Scorers */}
              <div className="px-4 pt-4 pb-2 border-b border-border/30">
                <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-secondary/40 max-w-lg">
                  {(
                    [
                      { id: "matches" as const, label: "Matches", icon: Calendar },
                      { id: "tables" as const, label: "Tables", icon: Trophy },
                      { id: "scorers" as const, label: "Scorers", icon: Clock },
                    ] as const
                  ).map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDataSection(id)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors",
                        dataSection === id
                          ? "bg-background text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Matches ── */}
              {dataSection === "matches" && (
                <div>
                  <div className="px-4 pt-3 pb-2 border-b border-border/20 overflow-x-auto">
                    <div className="flex gap-1 w-max min-w-full sm:min-w-0">
                      {(
                        [
                          { id: "today" as const, label: "Today" },
                          { id: "upcoming" as const, label: "Upcoming" },
                          { id: "results" as const, label: "Results" },
                          { id: "team" as const, label: "By team" },
                        ] as const
                      ).map(({ id, label }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setScheduleView(id)}
                          className={cn(
                            "px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors",
                            scheduleView === id
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-secondary/60",
                          )}
                        >
                          {label}
                          {id === "today" && liveMatches.length > 0 && (
                            <span className="ml-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-primary-foreground animate-pulse" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {scheduleView === "today" && (
                    <div className="grid lg:grid-cols-2 lg:divide-x divide-border/30">
                      <div className="min-w-0">
                        <div className="px-4 py-2.5 border-b border-border/20 bg-secondary/10 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                            Today&apos;s matches
                          </span>
                          {liveMatches.length > 0 && (
                            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                          )}
                        </div>
                        {liveMatches.length === 0 && todayUpcoming.length === 0 ? (
                          <p className="text-sm text-muted-foreground p-8 text-center">
                            No matches on today&apos;s schedule.
                            {upcomingMatches.length > 0 && (
                              <button
                                type="button"
                                className="block mx-auto mt-3 text-primary font-semibold hover:underline"
                                onClick={() => setScheduleView("upcoming")}
                              >
                                View upcoming fixtures →
                              </button>
                            )}
                          </p>
                        ) : (
                          <>
                            {liveMatches.length > 0 && (
                              <div>
                                <div className="px-4 py-2 bg-primary/5 border-b border-primary/15 flex items-center gap-2">
                                  <Radio className="w-3.5 h-3.5 text-primary animate-pulse" />
                                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                                    Live now
                                  </span>
                                </div>
                                {liveMatches.map((f) => (
                                  <MatchCard key={f.api_fixture_id} f={f} teams={teams} timeZone={timeZone} />
                                ))}
                              </div>
                            )}
                            {todayUpcoming.length > 0 && (
                              <div>
                                {liveMatches.length > 0 && (
                                  <div className="px-4 py-2 bg-secondary/20 border-b border-border/20">
                                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                                      Later today
                                    </span>
                                  </div>
                                )}
                                {todayUpcoming.map((f) => (
                                  <MatchCard key={f.api_fixture_id} f={f} teams={teams} timeZone={timeZone} />
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="min-w-0 border-t lg:border-t-0 border-border/30">
                        {todayCollapsedResults.length > 0 ? (
                          <RecentResultsBlock
                            results={todayCollapsedResults}
                            teams={teams}
                            timeZone={timeZone}
                            title="Recent results"
                            limit={8}
                            collapsible={false}
                          />
                        ) : (
                          <div>
                            <div className="px-4 py-2.5 border-b border-border/20 bg-secondary/10 flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                                Recent results
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground p-8 text-center">No recent results yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {scheduleView === "upcoming" && (
                    <div>
                      {upcomingMatches.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-8 text-center">No upcoming fixtures synced.</p>
                      ) : (
                        upcomingMatches.map((f) => (
                          <MatchCard key={f.api_fixture_id} f={f} teams={teams} timeZone={timeZone} />
                        ))
                      )}
                    </div>
                  )}

                  {scheduleView === "results" && (
                    <div>
                      {recentResults.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-8 text-center">No finished matches yet.</p>
                      ) : (
                        recentResults.slice(0, 30).map((f) => (
                          <MatchCard key={f.api_fixture_id} f={f} teams={teams} timeZone={timeZone} />
                        ))
                      )}
                    </div>
                  )}

                  {scheduleView === "team" && (
                    <div className="p-4 space-y-5">
                      <div>
                        <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                          Filter by team
                        </label>
                        <FootballTeamSelect teams={teams} value={teamFilter} onChange={setTeamFilter} />
                      </div>
                      {!teamFilter && (
                        <p className="text-sm text-muted-foreground">
                          Choose a team to see their upcoming fixtures and recent results.
                        </p>
                      )}
                      {teamFilter && (
                        <>
                          {upcomingForTeam.length > 0 && (
                            <div>
                              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                Upcoming
                              </h4>
                              <div className="rounded-xl border border-border overflow-hidden">
                                {upcomingForTeam.map((f) => (
                                  <MatchCard key={f.api_fixture_id} f={f} teams={teams} timeZone={timeZone} />
                                ))}
                              </div>
                            </div>
                          )}
                          {recentForTeam.length > 0 && (
                            <div>
                              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                Recent results
                              </h4>
                              <div className="rounded-xl border border-border overflow-hidden">
                                {recentForTeam.map((f) => (
                                  <MatchCard key={f.api_fixture_id} f={f} teams={teams} timeZone={timeZone} />
                                ))}
                              </div>
                            </div>
                          )}
                          {upcomingForTeam.length === 0 && recentForTeam.length === 0 && (
                            <p className="text-sm text-muted-foreground">No fixtures found for this team.</p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Group tables ── */}
              {dataSection === "tables" && (
                <div className="pb-2">
                  {standings.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-8 text-center">No standings available yet.</p>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-border/30 bg-secondary/10">
                        <p className="text-xs text-muted-foreground max-w-xl">
                          Top{" "}
                          <span className="text-primary font-semibold">{QUALIFYING_SPOTS} teams</span> per group advance
                          to the round of 32.
                        </p>
                        <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border/50 shrink-0">
                          <button
                            type="button"
                            onClick={() => setStandingsView("grid")}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors",
                              standingsView === "grid"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            <LayoutGrid className="w-3.5 h-3.5" /> All groups
                          </button>
                          <button
                            type="button"
                            onClick={() => setStandingsView("table")}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors",
                              standingsView === "table"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            <List className="w-3.5 h-3.5" /> Detail
                          </button>
                        </div>
                      </div>

                      {standingsView === "grid" ? (
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {groupsWithStandings.map((g) => (
                            <GroupStandingsCard
                              key={g}
                              group={g}
                              rows={standings}
                              teamNameById={teamNameById}
                              teams={teams}
                            />
                          ))}
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-wrap gap-1.5 px-4 py-3 border-b border-border/30">
                            {groupsWithStandings.map((g) => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => setActiveGroup(g)}
                                className={cn(
                                  "min-w-[2.25rem] px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                                  activeGroup === g
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "border-border text-muted-foreground hover:border-primary/50",
                                )}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                          <StandingsTableView
                            group={activeGroup}
                            rows={standings}
                            teamNameById={teamNameById}
                            teams={teams}
                          />
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── Top scorers ── */}
              {dataSection === "scorers" && (
                <div className="p-4">
                  {topScorers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Scorer data appears after matches finish.
                    </p>
                  ) : (
                    <TopScorersList scorers={topScorers} teams={teams} />
                  )}
                </div>
              )}
            </>
          )}

          <SyncStatusFooter jobs={syncJobs} isLoading={syncLoading} />
        </CardContent>
      </Card>
    </section>
  );
}
