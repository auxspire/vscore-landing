import type { FootballFixture, FootballStanding, FootballTeam } from "@/hooks/useFootballData";
import {
  R32_FIXTURE_SPEC,
  slotPlaceholderLabel,
  buildGroupResultsFromStandings,
  buildR32BracketSlots,
  type BracketTeamRecord,
} from "@/lib/bracket-builder";

export type KnockoutStage =
  | "round_of_32"
  | "round_of_16"
  | "quarterfinal"
  | "semifinal"
  | "final"
  | "third_place";

export interface BracketParticipant {
  apiTeamId: string | null;
  name: string;
  fifaCode: string | null;
  flagUrl: string | null;
  placeholder: string | null;
  /** Feeder match sides for flag-based TBD display (QF+). */
  feederTeams?: Array<{
    name: string;
    fifaCode: string | null;
    flagUrl: string | null;
    apiTeamId: string | null;
  }>;
}

export interface BracketMatchSide {
  participant: BracketParticipant;
  score: number | null;
}

export interface BracketMatch {
  id: string;
  stage: KnockoutStage;
  matchIndex: number;
  label: string;
  kickoffAt: string | null;
  home: BracketMatchSide;
  away: BracketMatchSide;
  isFinished: boolean;
  isLive: boolean;
  winnerId: string | null;
  /** Official fixture id when merged from API (for Winner/Loser Match N resolution). */
  apiFixtureId?: string | null;
}

export interface KnockoutBracketState {
  matches: BracketMatch[];
  champion: BracketParticipant | null;
  standingsAsOf: string | null;
  groupsComplete: boolean;
}

const STAGE_ORDER: KnockoutStage[] = [
  "round_of_32",
  "round_of_16",
  "quarterfinal",
  "semifinal",
  "final",
];

const STAGE_LABELS: Record<KnockoutStage, string> = {
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarterfinal: "Quarter-finals",
  semifinal: "Semi-finals",
  final: "Final",
  third_place: "Third place",
};

export function stageDisplayLabel(stage: KnockoutStage): string {
  return STAGE_LABELS[stage];
}

function toParticipant(team: BracketTeamRecord | null, slot: number): BracketParticipant {
  if (team) {
    return {
      apiTeamId: team.apiTeamId,
      name: team.name,
      fifaCode: team.fifaCode,
      flagUrl: team.flagUrl,
      placeholder: null,
    };
  }
  return {
    apiTeamId: null,
    name: slotPlaceholderLabel(slot),
    fifaCode: null,
    flagUrl: null,
    placeholder: slotPlaceholderLabel(slot),
  };
}

function normalizeStage(matchType: string | null): KnockoutStage | null {
  if (!matchType || matchType === "group") return null;
  const t = matchType.toLowerCase().replace(/[\s-]+/g, "_");
  if (t.includes("round_of_32") || t === "r32" || t.includes("round32")) return "round_of_32";
  if (t.includes("round_of_16") || t === "r16" || t.includes("round16")) return "round_of_16";
  if (t.includes("quarter") || t === "qf") return "quarterfinal";
  if (t.includes("semi") || t === "sf") return "semifinal";
  if (t.includes("third") || t === "3rd") return "third_place";
  if (t === "final" || t.endsWith("_final")) return "final";
  return null;
}

function isLiveFixture(f: FootballFixture): boolean {
  if (f.is_finished) return false;
  const t = (f.time_elapsed ?? "").toLowerCase();
  return t !== "" && t !== "notstarted" && t !== "null";
}

/** True when the API has a real team (not "Winner Match 74" placeholders). */
function isScheduledTeam(id: string | null, name: string | null): boolean {
  if (!id) return false;
  const n = (name ?? "").trim();
  if (!n) return false;
  return !/^(winner|loser)\s+(match|m)\b/i.test(n);
}

/** Strip nested "Winner/Loser of" prefix; return the readable matchup or team name. */
function extractSideLabel(p: BracketParticipant): string {
  if (p.apiTeamId) return p.name;
  let text = p.name.trim();
  for (let i = 0; i < 3; i++) {
    const m = text.match(/^(?:Winner|Loser) of\s+(.+)$/i);
    if (!m) break;
    text = m[1].trim();
    if (text.startsWith("(") && text.endsWith(")")) {
      text = text.slice(1, -1).trim();
    }
  }
  return text;
}

function useCompactFeederLabel(feeder: BracketMatch): boolean {
  return feeder.stage !== "round_of_32";
}

function formatFeederWinnerLabel(feeder: BracketMatch, forceCompact?: boolean): string {
  const home = extractSideLabel(feeder.home.participant);
  const away = extractSideLabel(feeder.away.participant);
  const compact = forceCompact ?? useCompactFeederLabel(feeder);
  if (compact) {
    return `Winner of (${home} · ${away})`;
  }
  return `Winner of ${home} vs ${away}`;
}

function formatFeederLoserLabel(feeder: BracketMatch, forceCompact?: boolean): string {
  const home = extractSideLabel(feeder.home.participant);
  const away = extractSideLabel(feeder.away.participant);
  const compact = forceCompact ?? useCompactFeederLabel(feeder);
  if (compact) {
    return `Loser of (${home} · ${away})`;
  }
  return `Loser of ${home} vs ${away}`;
}

function buildFixtureIdMap(matches: BracketMatch[]): Map<string, BracketMatch> {
  const map = new Map<string, BracketMatch>();
  for (const m of matches) {
    if (m.apiFixtureId) map.set(m.apiFixtureId, m);
  }
  return map;
}

function parseApiMatchPlaceholder(
  name: string | null,
): { kind: "winner" | "loser"; fixtureId: string } | null {
  const m = (name ?? "").trim().match(/^(Winner|Loser)\s+Match\s+(\d+)$/i);
  if (!m) return null;
  return {
    kind: m[1].toLowerCase() === "loser" ? "loser" : "winner",
    fixtureId: m[2],
  };
}

function participantFromApiPlaceholder(
  name: string | null,
  fixtureIdToMatch: Map<string, BracketMatch>,
  displayStage?: KnockoutStage,
): BracketParticipant | null {
  const parsed = parseApiMatchPlaceholder(name);
  if (!parsed) return null;
  const feeder = fixtureIdToMatch.get(parsed.fixtureId);
  if (!feeder) return null;
  const compact =
    displayStage != null &&
    displayStage !== "round_of_32" &&
    displayStage !== "round_of_16";
  const label =
    parsed.kind === "winner"
      ? formatFeederWinnerLabel(feeder, compact)
      : formatFeederLoserLabel(feeder, compact);
  return {
    apiTeamId: null,
    name: label,
    fifaCode: null,
    flagUrl: null,
    placeholder: label,
    feederTeams: [sideSnapshot(feeder.home.participant), sideSnapshot(feeder.away.participant)],
  };
}

function sideSnapshot(p: BracketParticipant): NonNullable<BracketParticipant["feederTeams"]>[number] {
  if (p.apiTeamId) {
    return {
      name: p.name,
      fifaCode: p.fifaCode,
      flagUrl: p.flagUrl,
      apiTeamId: p.apiTeamId,
    };
  }
  return {
    name: extractSideLabel(p),
    fifaCode: p.fifaCode,
    flagUrl: p.flagUrl,
    apiTeamId: null,
  };
}

function participantFromFeederMatch(feeder: BracketMatch): BracketParticipant {
  const winner = resolveWinner(feeder);
  if (winner?.apiTeamId) return winner;

  const feederTeams = [sideSnapshot(feeder.home.participant), sideSnapshot(feeder.away.participant)];
  const label = formatFeederWinnerLabel(feeder);

  return {
    apiTeamId: null,
    name: label,
    fifaCode: null,
    flagUrl: null,
    placeholder: label,
    feederTeams,
  };
}

function resolveFixtureParticipant(
  teamId: string | null,
  teamName: string | null,
  teams: FootballTeam[],
  fixtureIdToMatch: Map<string, BracketMatch>,
  displayStage?: KnockoutStage,
): BracketParticipant {
  if (isScheduledTeam(teamId, teamName) && teamId) {
    return participantFromFixtureTeam(teamId, teamName, teams);
  }
  const fromApi = participantFromApiPlaceholder(teamName, fixtureIdToMatch, displayStage);
  if (fromApi) return fromApi;
  return {
    apiTeamId: teamId,
    name: teamName ?? "TBD",
    fifaCode: teamId
      ? (teams.find((t) => t.api_team_id === teamId)?.fifa_code ?? null)
      : null,
    flagUrl: teamId
      ? (teams.find((t) => t.api_team_id === teamId)?.flag_url ?? null)
      : null,
    placeholder: teamId ? null : (teamName ?? "TBD"),
  };
}

function participantFromFixtureTeam(
  teamId: string,
  teamName: string | null,
  teams: FootballTeam[],
): BracketParticipant {
  const meta = teams.find((t) => t.api_team_id === teamId);
  return {
    apiTeamId: teamId,
    name: teamName ?? meta?.name_en ?? "TBD",
    fifaCode: meta?.fifa_code ?? null,
    flagUrl: meta?.flag_url ?? null,
    placeholder: null,
  };
}

function fixtureMatchScore(
  match: BracketMatch,
  fixture: FootballFixture,
): number {
  const matchIds = [match.home.participant.apiTeamId, match.away.participant.apiTeamId].filter(
    Boolean,
  ) as string[];
  const fixtureIds = [fixture.home_team_id, fixture.away_team_id].filter(Boolean) as string[];
  const overlap = matchIds.filter((id) => fixtureIds.includes(id)).length;
  const bothScheduled =
    isScheduledTeam(fixture.home_team_id, fixture.home_team_name) &&
    isScheduledTeam(fixture.away_team_id, fixture.away_team_name);
  if (overlap === 2) return 4;
  if (overlap === 1 && bothScheduled) return 3;
  if (overlap === 1) return 2;
  if (bothScheduled) return 1;
  return 0;
}

function mergeMatchWithFixture(
  match: BracketMatch,
  fixture: FootballFixture,
  teams: FootballTeam[],
  fixtureIdToMatch: Map<string, BracketMatch>,
): BracketMatch {
  let home = match.home;
  let away = match.away;

  if (isScheduledTeam(fixture.home_team_id, fixture.home_team_name) && fixture.home_team_id) {
    home = {
      participant: participantFromFixtureTeam(
        fixture.home_team_id,
        fixture.home_team_name,
        teams,
      ),
      score: null,
    };
  } else {
    const fromApi = participantFromApiPlaceholder(
      fixture.home_team_name,
      fixtureIdToMatch,
      match.stage,
    );
    if (fromApi) home = { participant: fromApi, score: null };
  }

  if (isScheduledTeam(fixture.away_team_id, fixture.away_team_name) && fixture.away_team_id) {
    away = {
      participant: participantFromFixtureTeam(
        fixture.away_team_id,
        fixture.away_team_name,
        teams,
      ),
      score: null,
    };
  } else {
    const fromApi = participantFromApiPlaceholder(
      fixture.away_team_name,
      fixtureIdToMatch,
      match.stage,
    );
    if (fromApi) away = { participant: fromApi, score: null };
  }

  return applyFixture(
    { ...match, home, away, apiFixtureId: fixture.api_fixture_id },
    fixture,
  );
}

function bothTeamsScheduled(fixture: FootballFixture): boolean {
  return (
    isScheduledTeam(fixture.home_team_id, fixture.home_team_name) &&
    isScheduledTeam(fixture.away_team_id, fixture.away_team_name)
  );
}

function slotHasTeamId(match: BracketMatch, teamId: string): boolean {
  return (
    match.home.participant.apiTeamId === teamId || match.away.participant.apiTeamId === teamId
  );
}

/** Prefer official KO fixtures over projected standings slots (fixes 3rd-place pairing). */
function overlayStageFixtures(
  matches: BracketMatch[],
  fixtures: FootballFixture[],
  stage: KnockoutStage,
  teams: FootballTeam[],
  fixtureIdToMatch: Map<string, BracketMatch>,
): BracketMatch[] {
  const stageFixtures = fixtures
    .filter((f) => normalizeStage(f.match_type) === stage)
    .sort((a, b) => Number(a.api_fixture_id) - Number(b.api_fixture_id));

  const usedFixtures = new Set<string>();
  const usedSlots = new Set<number>();
  const result = [...matches];

  // Pass 1: both teams known — require 2-team overlap (prevents wrong slot assignment).
  for (let i = 0; i < result.length; i++) {
    for (const f of stageFixtures) {
      if (usedFixtures.has(f.api_fixture_id)) continue;
      if (!bothTeamsScheduled(f)) continue;
      if (fixtureMatchScore(result[i], f) < 4) continue;
      result[i] = mergeMatchWithFixture(result[i], f, teams, fixtureIdToMatch);
      usedFixtures.add(f.api_fixture_id);
      usedSlots.add(i);
      break;
    }
  }

  // Pass 2: one known team (e.g. Paraguay vs Winner Match 77).
  for (const f of stageFixtures) {
    if (usedFixtures.has(f.api_fixture_id)) continue;
    const homeKnown = isScheduledTeam(f.home_team_id, f.home_team_name);
    const awayKnown = isScheduledTeam(f.away_team_id, f.away_team_name);
    if (homeKnown && awayKnown) continue;
    if (!homeKnown && !awayKnown) continue;

    const knownId = homeKnown ? f.home_team_id! : f.away_team_id!;
    let slot = -1;
    for (let i = 0; i < result.length; i++) {
      if (usedSlots.has(i)) continue;
      if (slotHasTeamId(result[i], knownId)) {
        slot = i;
        break;
      }
    }
    if (slot < 0) {
      for (let i = 0; i < result.length; i++) {
        if (!usedSlots.has(i)) {
          slot = i;
          break;
        }
      }
    }
    if (slot >= 0) {
      result[slot] = mergeMatchWithFixture(result[slot], f, teams, fixtureIdToMatch);
      usedFixtures.add(f.api_fixture_id);
      usedSlots.add(slot);
    }
  }

  // Pass 3: placeholder-only fixtures — fill remaining slots in API order.
  const remainingFixtures = stageFixtures.filter((f) => !usedFixtures.has(f.api_fixture_id));
  const remainingSlots = result.map((_, i) => i).filter((i) => !usedSlots.has(i));
  remainingFixtures.forEach((f, idx) => {
    const slot = remainingSlots[idx];
    if (slot == null) return;
    result[slot] = mergeMatchWithFixture(result[slot], f, teams, fixtureIdToMatch);
    usedFixtures.add(f.api_fixture_id);
  });

  return result;
}

/** When a KO match ends level, infer the winner from who appears in the next round. */
function inferWinnersFromNextRound(
  matches: BracketMatch[],
  fixtures: FootballFixture[],
  nextStage: KnockoutStage,
): BracketMatch[] {
  const nextFixtures = fixtures.filter((f) => normalizeStage(f.match_type) === nextStage);

  return matches.map((match) => {
    if (match.winnerId || !match.isFinished) return match;
    const hs = match.home.score;
    const as = match.away.score;
    if (hs == null || as == null || hs !== as) return match;

    const teamIds = [match.home.participant.apiTeamId, match.away.participant.apiTeamId].filter(
      Boolean,
    ) as string[];
    if (teamIds.length !== 2) return match;

    const advanced = teamIds.filter((id) =>
      nextFixtures.some((f) => f.home_team_id === id || f.away_team_id === id),
    );
    if (advanced.length !== 1) return match;

    return { ...match, winnerId: advanced[0] };
  });
}

function findFixture(
  fixtures: FootballFixture[],
  teamA: string | null,
  teamB: string | null,
  stage?: KnockoutStage,
): FootballFixture | undefined {
  if (!teamA || !teamB) return undefined;
  return fixtures.find((f) => {
    if (stage) {
      const s = normalizeStage(f.match_type);
      if (s !== stage) return false;
    }
    const home = f.home_team_id;
    const away = f.away_team_id;
    return (
      (home === teamA && away === teamB) ||
      (home === teamB && away === teamA)
    );
  });
}

function resolveWinner(match: BracketMatch): BracketParticipant | null {
  if (match.winnerId) {
    if (match.home.participant.apiTeamId === match.winnerId) return match.home.participant;
    if (match.away.participant.apiTeamId === match.winnerId) return match.away.participant;
  }
  if (!match.isFinished) return null;
  const hs = match.home.score;
  const as = match.away.score;
  if (hs == null || as == null) return null;
  if (hs > as) return match.home.participant;
  if (as > hs) return match.away.participant;
  return null;
}

function applyFixture(
  match: BracketMatch,
  fixture: FootballFixture | undefined,
): BracketMatch {
  if (!fixture) return match;

  const homeId = fixture.home_team_id;
  const awayId = fixture.away_team_id;
  let home = match.home;
  let away = match.away;

  if (homeId && awayId) {
    if (match.home.participant.apiTeamId === homeId) {
      home = {
        ...match.home,
        score: fixture.home_goals,
      };
      away = {
        ...match.away,
        score: fixture.away_goals,
      };
    } else if (match.home.participant.apiTeamId === awayId) {
      home = {
        ...match.home,
        score: fixture.away_goals,
      };
      away = {
        ...match.away,
        score: fixture.home_goals,
      };
    } else {
      home = { ...match.home, score: fixture.home_goals };
      away = { ...match.away, score: fixture.away_goals };
    }
  }

  const finished = fixture.is_finished;
  const live = isLiveFixture(fixture);

  // API often sends 0-0 for fixtures not yet kicked off — show blank until live/finished.
  if (!finished && !live) {
    home = { ...home, score: null };
    away = { ...away, score: null };
  }

  let winnerId: string | null = null;
  if (finished && home.score != null && away.score != null) {
    if (home.score > away.score) winnerId = home.participant.apiTeamId;
    else if (away.score > home.score) winnerId = away.participant.apiTeamId;
  }

  return {
    ...match,
    kickoffAt: fixture.kickoff_at ?? match.kickoffAt,
    home,
    away,
    isFinished: finished,
    isLive: live,
    winnerId,
  };
}

function buildMatch(
  stage: KnockoutStage,
  matchIndex: number,
  label: string,
  home: BracketParticipant,
  away: BracketParticipant,
  fixtures: FootballFixture[],
): BracketMatch {
  const base: BracketMatch = {
    id: `${stage}-${matchIndex}`,
    stage,
    matchIndex,
    label,
    kickoffAt: null,
    home: { participant: home, score: null },
    away: { participant: away, score: null },
    isFinished: false,
    isLive: false,
    winnerId: null,
  };
  return applyFixture(
    base,
    findFixture(fixtures, home.apiTeamId, away.apiTeamId, stage),
  );
}

function advanceRound(
  prev: BracketMatch[],
  stage: KnockoutStage,
  fixtures: FootballFixture[],
): BracketMatch[] {
  const next: BracketMatch[] = [];
  for (let i = 0; i < prev.length; i += 2) {
    const matchIndex = i / 2;
    const label =
      stage === "final"
        ? "Final"
        : stage === "quarterfinal"
          ? `QF ${matchIndex + 1}`
          : stage === "semifinal"
            ? `SF ${matchIndex + 1}`
            : `M${matchIndex + 1}`;

    next.push(
      buildMatch(
        stage,
        matchIndex,
        label,
        participantFromFeederMatch(prev[i]),
        participantFromFeederMatch(prev[i + 1]),
        fixtures,
      ),
    );
  }
  return next;
}

export function buildKnockoutBracketState(input: {
  standings: FootballStanding[];
  teams: FootballTeam[];
  fixtures: FootballFixture[];
  fetchedAt?: string | null;
}): KnockoutBracketState {
  const { standings, teams, fixtures } = input;
  const knockoutFixtures = fixtures.filter((f) => normalizeStage(f.match_type));

  const { groupResults, allThirdCandidates } = buildGroupResultsFromStandings(standings, teams);
  const groupsComplete = Object.keys(groupResults).length === 12;
  const r32Slots = buildR32BracketSlots(groupResults, allThirdCandidates);

  const r32Projected = R32_FIXTURE_SPEC.map((spec, i) =>
    buildMatch(
      "round_of_32",
      i,
      spec.label,
      toParticipant(r32Slots[spec.slots[0]], spec.slots[0]),
      toParticipant(r32Slots[spec.slots[1]], spec.slots[1]),
      knockoutFixtures,
    ),
  );

  const r32Matches = inferWinnersFromNextRound(
    overlayStageFixtures(
      r32Projected,
      knockoutFixtures,
      "round_of_32",
      teams,
      new Map(),
    ),
    knockoutFixtures,
    "round_of_16",
  );

  const fixtureIdToMatchAfterR32 = buildFixtureIdMap(r32Matches);

  const r16 = inferWinnersFromNextRound(
    overlayStageFixtures(
      advanceRound(r32Matches, "round_of_16", knockoutFixtures),
      knockoutFixtures,
      "round_of_16",
      teams,
      fixtureIdToMatchAfterR32,
    ),
    knockoutFixtures,
    "quarterfinal",
  );

  const fixtureIdToMatchAfterR16 = buildFixtureIdMap([...r32Matches, ...r16]);

  const qf = inferWinnersFromNextRound(
    overlayStageFixtures(
      advanceRound(r16, "quarterfinal", knockoutFixtures),
      knockoutFixtures,
      "quarterfinal",
      teams,
      fixtureIdToMatchAfterR16,
    ),
    knockoutFixtures,
    "semifinal",
  );

  const fixtureIdToMatchAfterQf = buildFixtureIdMap([...r32Matches, ...r16, ...qf]);

  const sf = inferWinnersFromNextRound(
    overlayStageFixtures(
      advanceRound(qf, "semifinal", knockoutFixtures),
      knockoutFixtures,
      "semifinal",
      teams,
      fixtureIdToMatchAfterQf,
    ),
    knockoutFixtures,
    "final",
  );

  const fixtureIdToMatchAfterSf = buildFixtureIdMap([...r32Matches, ...r16, ...qf, ...sf]);

  const finalMatch = overlayStageFixtures(
    advanceRound(sf, "final", knockoutFixtures),
    knockoutFixtures,
    "final",
    teams,
    fixtureIdToMatchAfterSf,
  )[0];

  const thirdPlaceFixture = knockoutFixtures.find((f) => normalizeStage(f.match_type) === "third_place");
  let thirdPlace: BracketMatch | null = null;
  if (thirdPlaceFixture) {
    thirdPlace = applyFixture(
      {
        id: "third_place-0",
        stage: "third_place",
        matchIndex: 0,
        label: "Third place",
        kickoffAt: null,
        apiFixtureId: thirdPlaceFixture.api_fixture_id,
        home: {
          participant: resolveFixtureParticipant(
            thirdPlaceFixture.home_team_id,
            thirdPlaceFixture.home_team_name,
            teams,
            fixtureIdToMatchAfterSf,
            "third_place",
          ),
          score: null,
        },
        away: {
          participant: resolveFixtureParticipant(
            thirdPlaceFixture.away_team_id,
            thirdPlaceFixture.away_team_name,
            teams,
            fixtureIdToMatchAfterSf,
            "third_place",
          ),
          score: null,
        },
        isFinished: false,
        isLive: false,
        winnerId: null,
      },
      thirdPlaceFixture,
    );
  }

  const allMatches = [
    ...r32Matches,
    ...r16,
    ...qf,
    ...sf,
    finalMatch,
    ...(thirdPlace ? [thirdPlace] : []),
  ];

  const championWinner = finalMatch ? resolveWinner(finalMatch) : null;

  return {
    matches: allMatches,
    champion: championWinner,
    standingsAsOf: input.fetchedAt ?? null,
    groupsComplete,
  };
}

export function matchesByStage(state: KnockoutBracketState): Map<KnockoutStage, BracketMatch[]> {
  const map = new Map<KnockoutStage, BracketMatch[]>();
  for (const stage of [...STAGE_ORDER, "third_place" as KnockoutStage]) {
    map.set(
      stage,
      state.matches.filter((m) => m.stage === stage),
    );
  }
  return map;
}
