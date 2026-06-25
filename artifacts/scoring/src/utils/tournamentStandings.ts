/** League standings from completed tournament matches. */

export interface StandingRow {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
}

export interface TournamentLike {
  id?: number | string;
  participatingTeams?: Array<string | { name?: string; id?: number | string }>;
  teams?: string[];
  pointsSystem?: { win?: number; draw?: number; loss?: number };
}

export interface MatchLike {
  id?: number | string;
  tournamentId?: number | string;
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
}

function teamName(t: string | { name?: string }): string {
  return typeof t === "string" ? t : (t.name ?? "");
}

function teamA(m: MatchLike): string {
  return m.teamA ?? m.team1 ?? "";
}

function teamB(m: MatchLike): string {
  return m.teamB ?? m.team2 ?? "";
}

function scoreA(m: MatchLike): number {
  return Number(m.scoreA ?? m.team1Score ?? 0);
}

function scoreB(m: MatchLike): number {
  return Number(m.scoreB ?? m.team2Score ?? 0);
}

function isCompleted(m: MatchLike): boolean {
  if (m.completedAt) return true;
  const s = (m.status ?? "").toLowerCase();
  return s.includes("full") || s.includes("finished") || s === "completed" || s === "ft";
}

export function filterTournamentMatches(
  matches: MatchLike[],
  tournamentId: number | string,
): MatchLike[] {
  return matches.filter(
    (m) => m.tournamentId != null && String(m.tournamentId) === String(tournamentId),
  );
}

export function calculateStandings(
  tournament: TournamentLike,
  matches: MatchLike[],
): StandingRow[] {
  const winPts = tournament.pointsSystem?.win ?? 3;
  const drawPts = tournament.pointsSystem?.draw ?? 1;
  const lossPts = tournament.pointsSystem?.loss ?? 0;

  const teamList =
    tournament.participatingTeams?.map(teamName) ??
    tournament.teams ??
    [];

  const standings: StandingRow[] = teamList.map((team) => ({
    team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    position: 0,
  }));

  const findRow = (name: string) => standings.find((s) => s.team === name);

  for (const match of matches.filter(isCompleted)) {
    const t1 = teamA(match);
    const t2 = teamB(match);
    const s1 = scoreA(match);
    const s2 = scoreB(match);
    const row1 = findRow(t1);
    const row2 = findRow(t2);
    if (!row1 || !row2) continue;

    row1.played++;
    row2.played++;
    row1.goalsFor += s1;
    row1.goalsAgainst += s2;
    row2.goalsFor += s2;
    row2.goalsAgainst += s1;

    if (s1 > s2) {
      row1.won++;
      row2.lost++;
      row1.points += winPts;
      row2.points += lossPts;
    } else if (s1 < s2) {
      row1.lost++;
      row2.won++;
      row1.points += lossPts;
      row2.points += winPts;
    } else {
      row1.drawn++;
      row2.drawn++;
      row1.points += drawPts;
      row2.points += drawPts;
    }
  }

  for (const row of standings) {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
  }

  standings.sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
    if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
    return a.team.localeCompare(b.team);
  });

  standings.forEach((row, i) => {
    row.position = i + 1;
  });

  return standings;
}
