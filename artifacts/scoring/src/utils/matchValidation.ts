/** Pure validation helpers for PRD match-flow rules (unit + combination tested). */

export function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export function isDuplicateTeamName(
  teams: Array<{ name: string }>,
  teamName: string,
): boolean {
  const normalized = normalizeName(teamName);
  if (!normalized) return false;
  return teams.some((t) => normalizeName(t.name) === normalized);
}

export function isSameTeamInMatch(team1: string, team2: string): boolean {
  const a = normalizeName(team1);
  const b = normalizeName(team2);
  return Boolean(a && b && a === b);
}

export function getSquadRemaining(selected: number, required: number): number {
  return Math.max(0, required - selected);
}

export function isSquadComplete(selected: number, required: number): boolean {
  return required > 0 && selected === required;
}

export function getSquadWarningMessage(
  teamLabel: string,
  selected: number,
  required: number,
): string | null {
  const remaining = getSquadRemaining(selected, required);
  if (remaining <= 0) return null;
  const noun = remaining === 1 ? "player" : "players";
  return `Please add ${remaining} more ${noun} to ${teamLabel}`;
}

export function canStartMatch(
  team1Selected: number,
  team2Selected: number,
  playersPerTeam: number,
): boolean {
  return (
    isSquadComplete(team1Selected, playersPerTeam) &&
    isSquadComplete(team2Selected, playersPerTeam)
  );
}

export function hasDuplicatePlayerName(
  players: Array<{ name: string }>,
  name: string,
): boolean {
  const normalized = normalizeName(name);
  if (!normalized) return false;
  return players.some((p) => normalizeName(p.name) === normalized);
}

export const MATCH_FORMATS = ["single", "halves"] as const;
export type MatchFormat = (typeof MATCH_FORMATS)[number];

export function isValidMatchFormat(format: string): format is MatchFormat {
  return (MATCH_FORMATS as readonly string[]).includes(format);
}

export interface NewMatchFormInput {
  team1: string;
  team2: string;
  matchFormat: string;
  duration: string;
  playersPerTeam: string;
  scoringLevel: string;
}

export function isNewMatchFormReady(input: NewMatchFormInput): boolean {
  const duration = parseInt(input.duration, 10);
  const playersPerTeam = parseInt(input.playersPerTeam, 10);

  return (
    Boolean(input.team1.trim()) &&
    Boolean(input.team2.trim()) &&
    !isSameTeamInMatch(input.team1, input.team2) &&
    isValidMatchFormat(input.matchFormat) &&
    Boolean(input.scoringLevel) &&
    !Number.isNaN(duration) &&
    duration >= 5 &&
    duration <= 90 &&
    !Number.isNaN(playersPerTeam) &&
    playersPerTeam >= 1 &&
    playersPerTeam <= 11
  );
}

export interface MatchEvent {
  minute?: number;
  type: string;
  team?: string;
  player?: { id?: number; name?: string };
  assist?: { id?: number; name?: string } | null;
  card?: "yellow" | "red" | null;
  playerOut?: { id?: number; name?: string };
  playerIn?: { id?: number; name?: string };
}

export function validateRecordedEvent(event: MatchEvent): string[] {
  const errors: string[] = [];
  if (!event.type) errors.push("Event type is required");
  if (event.type === "goal" && !event.player?.name) {
    errors.push("Goal requires a scorer");
  }
  if (event.type === "substitution") {
    if (!event.playerOut?.name) errors.push("Substitution requires player out");
    if (!event.playerIn?.name) errors.push("Substitution requires player in");
  }
  if (event.card && event.card !== "yellow" && event.card !== "red") {
    errors.push("Card must be yellow or red");
  }
  return errors;
}
