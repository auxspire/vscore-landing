/** Aggregate leaderboard / stats from real completed matches (no mock data). */

export interface CompletedMatchLike {
  id?: number | string;
  team1?: string;
  team2?: string;
  teamA?: string;
  teamB?: string;
  scoreA?: number;
  scoreB?: number;
  events?: Array<{
    type?: string;
    team?: string;
    teamName?: string;
    teamNumber?: number;
    player?: { id?: number; name?: string };
    assist?: { id?: number; name?: string };
  }>;
}

export interface PlayerLeaderboardRow {
  id: number | string;
  name: string;
  team: string;
  goals: number;
  assists: number;
  matches: number;
}

export interface TeamLeaderboardRow {
  id: number | string;
  name: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  gf: number;
  ga: number;
}

function teamAName(match: CompletedMatchLike): string {
  return match.teamA ?? match.team1 ?? "";
}

function teamBName(match: CompletedMatchLike): string {
  return match.teamB ?? match.team2 ?? "";
}

function eventTeamName(
  match: CompletedMatchLike,
  event: NonNullable<CompletedMatchLike["events"]>[number],
): string {
  if (event.teamName) return event.teamName;
  if (event.team) return event.team;
  if (event.teamNumber === 1) return teamAName(match);
  if (event.teamNumber === 2) return teamBName(match);
  return "";
}

export function aggregatePlayerStats(
  completedMatches: CompletedMatchLike[],
): PlayerLeaderboardRow[] {
  const byKey = new Map<string, PlayerLeaderboardRow>();
  const matchCount = new Map<string, Set<string | number>>();

  for (const match of completedMatches) {
    const matchId = match.id ?? JSON.stringify([teamAName(match), teamBName(match)]);
    const events = match.events ?? [];

    for (const event of events) {
      const team = eventTeamName(match, event);

      if (event.type === "goal" && event.player?.name) {
        const key = `${event.player.id ?? event.player.name}::${team}`;
        const row =
          byKey.get(key) ??
          ({
            id: event.player.id ?? key,
            name: event.player.name,
            team,
            goals: 0,
            assists: 0,
            matches: 0,
          } satisfies PlayerLeaderboardRow);
        row.goals += 1;
        byKey.set(key, row);

        const played = matchCount.get(key) ?? new Set();
        played.add(matchId);
        matchCount.set(key, played);
      }

      if (event.assist?.name) {
        const assistKey = `${event.assist.id ?? event.assist.name}::${team}`;
        const assistRow =
          byKey.get(assistKey) ??
          ({
            id: event.assist.id ?? assistKey,
            name: event.assist.name,
            team,
            goals: 0,
            assists: 0,
            matches: 0,
          } satisfies PlayerLeaderboardRow);
        assistRow.assists += 1;
        byKey.set(assistKey, assistRow);

        const played = matchCount.get(assistKey) ?? new Set();
        played.add(matchId);
        matchCount.set(assistKey, played);
      }
    }
  }

  for (const [key, row] of byKey) {
    row.matches = matchCount.get(key)?.size ?? 0;
  }

  return [...byKey.values()].sort((a, b) => b.goals - a.goals || b.assists - a.assists);
}

export function aggregateTeamStats(
  completedMatches: CompletedMatchLike[],
): TeamLeaderboardRow[] {
  const byName = new Map<string, TeamLeaderboardRow>();

  const ensure = (name: string): TeamLeaderboardRow => {
    const existing = byName.get(name);
    if (existing) return existing;
    const row: TeamLeaderboardRow = {
      id: name,
      name,
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      gf: 0,
      ga: 0,
    };
    byName.set(name, row);
    return row;
  };

  for (const match of completedMatches) {
    const a = teamAName(match);
    const b = teamBName(match);
    if (!a || !b) continue;

    const scoreA = match.scoreA ?? 0;
    const scoreB = match.scoreB ?? 0;

    const teamA = ensure(a);
    const teamB = ensure(b);

    teamA.matches += 1;
    teamB.matches += 1;
    teamA.gf += scoreA;
    teamA.ga += scoreB;
    teamB.gf += scoreB;
    teamB.ga += scoreA;

    if (scoreA > scoreB) {
      teamA.wins += 1;
      teamB.losses += 1;
      teamA.points += 3;
    } else if (scoreB > scoreA) {
      teamB.wins += 1;
      teamA.losses += 1;
      teamB.points += 3;
    } else {
      teamA.draws += 1;
      teamB.draws += 1;
      teamA.points += 1;
      teamB.points += 1;
    }
  }

  return [...byName.values()].sort((a, b) => b.points - a.points || b.gf - a.gf);
}
