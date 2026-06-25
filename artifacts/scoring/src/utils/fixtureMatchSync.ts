/** Sync tournament fixture rows when a linked match completes. */

export interface FixtureRow {
  id?: string | number;
  team1?: string;
  team2?: string;
  homeTeam?: string;
  awayTeam?: string;
  matchId?: string | number;
  status?: "scheduled" | "live" | "completed";
  score?: { home?: number; away?: number; team1?: number; team2?: number };
  [key: string]: unknown;
}

export interface FixturesStore {
  fixtures?: FixtureRow[];
  status?: string;
  [key: string]: unknown;
}

function team1(fixture: FixtureRow): string {
  return fixture.team1 ?? fixture.homeTeam ?? "";
}

function team2(fixture: FixtureRow): string {
  return fixture.team2 ?? fixture.awayTeam ?? "";
}

export function findFixtureById(
  store: FixturesStore | null,
  fixtureId: string | number,
): FixtureRow | null {
  const list = store?.fixtures ?? [];
  return list.find((f) => String(f.id) === String(fixtureId)) ?? null;
}

export function syncFixtureFromMatch(
  store: FixturesStore | null,
  match: {
    id?: string | number;
    fixtureId?: string | number;
    team1?: string;
    team2?: string;
    teamA?: string;
    teamB?: string;
    scoreA?: number;
    scoreB?: number;
    team1Score?: number;
    team2Score?: number;
    status?: string;
    completedAt?: string;
  },
): FixturesStore | null {
  if (!store?.fixtures?.length || match.fixtureId == null) return store;

  const mTeam1 = match.teamA ?? match.team1 ?? "";
  const mTeam2 = match.teamB ?? match.team2 ?? "";
  const s1 = Number(match.scoreA ?? match.team1Score ?? 0);
  const s2 = Number(match.scoreB ?? match.team2Score ?? 0);
  const done =
    Boolean(match.completedAt) ||
    (match.status ?? "").toLowerCase().includes("full") ||
    (match.status ?? "").toLowerCase() === "completed";

  const fixtures = store.fixtures.map((f) => {
    if (String(f.id) !== String(match.fixtureId)) return f;
    return {
      ...f,
      matchId: match.id,
      status: done ? "completed" : "live",
      score: { home: s1, away: s2, team1: s1, team2: s2 },
    };
  });

  return { ...store, fixtures };
}

export function buildInitialMatchFromFixture(
  fixture: FixtureRow,
  tournament: { id?: number | string; name?: string; playersPerTeam?: number | string; matchDuration?: number | string },
): Record<string, unknown> {
  return {
    selectedTournament: String(tournament.id),
    tournamentId: tournament.id,
    tournamentName: tournament.name,
    fixtureId: fixture.id,
    team1: team1(fixture),
    team2: team2(fixture),
    teamA: team1(fixture),
    teamB: team2(fixture),
    playersPerTeam: tournament.playersPerTeam ?? "",
    duration: tournament.matchDuration ?? "60",
  };
}

export function loadFixturesStore(tournamentId: number | string): FixturesStore | null {
  try {
    const raw = localStorage.getItem(`fixtures_${tournamentId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveFixturesStore(tournamentId: number | string, store: FixturesStore): void {
  localStorage.setItem(`fixtures_${tournamentId}`, JSON.stringify(store));
}

export function persistFixtureSyncForMatch(match: Parameters<typeof syncFixtureFromMatch>[1]): void {
  const tid = (match as { tournamentId?: number | string }).tournamentId;
  if (tid == null || match.fixtureId == null) return;
  const store = loadFixturesStore(tid);
  if (!store) return;
  const updated = syncFixtureFromMatch(store, match);
  if (updated) saveFixturesStore(tid, updated);
}
