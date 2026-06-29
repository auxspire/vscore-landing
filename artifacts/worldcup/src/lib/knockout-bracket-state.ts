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

function participantFromWinner(winner: BracketParticipant | null, label: string): BracketParticipant {
  if (winner?.apiTeamId) return winner;
  return {
    apiTeamId: null,
    name: label,
    fifaCode: null,
    flagUrl: null,
    placeholder: label,
  };
}

function advanceRound(
  prev: BracketMatch[],
  stage: KnockoutStage,
  fixtures: FootballFixture[],
): BracketMatch[] {
  const next: BracketMatch[] = [];
  for (let i = 0; i < prev.length; i += 2) {
    const a = resolveWinner(prev[i]);
    const b = resolveWinner(prev[i + 1]);
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
        participantFromWinner(a, `Winner ${prev[i].label}`),
        participantFromWinner(b, `Winner ${prev[i + 1].label}`),
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

  const r32Matches = R32_FIXTURE_SPEC.map((spec, i) =>
    buildMatch(
      "round_of_32",
      i,
      spec.label,
      toParticipant(r32Slots[spec.slots[0]], spec.slots[0]),
      toParticipant(r32Slots[spec.slots[1]], spec.slots[1]),
      knockoutFixtures,
    ),
  );

  const r16 = advanceRound(r32Matches, "round_of_16", knockoutFixtures);
  const qf = advanceRound(r16, "quarterfinal", knockoutFixtures);
  const sf = advanceRound(qf, "semifinal", knockoutFixtures);
  const finalMatch = advanceRound(sf, "final", knockoutFixtures)[0];

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
        home: {
          participant: {
            apiTeamId: thirdPlaceFixture.home_team_id,
            name: thirdPlaceFixture.home_team_name ?? "TBD",
            fifaCode: teams.find((t) => t.api_team_id === thirdPlaceFixture.home_team_id)?.fifa_code ?? null,
            flagUrl: teams.find((t) => t.api_team_id === thirdPlaceFixture.home_team_id)?.flag_url ?? null,
            placeholder: null,
          },
          score: null,
        },
        away: {
          participant: {
            apiTeamId: thirdPlaceFixture.away_team_id,
            name: thirdPlaceFixture.away_team_name ?? "TBD",
            fifaCode: teams.find((t) => t.api_team_id === thirdPlaceFixture.away_team_id)?.fifa_code ?? null,
            flagUrl: teams.find((t) => t.api_team_id === thirdPlaceFixture.away_team_id)?.flag_url ?? null,
            placeholder: null,
          },
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
