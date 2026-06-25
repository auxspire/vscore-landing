/** Public match fetch + PII redaction for spectator views. */

import { publicAnonKey, scoringFunctionsUrl } from "./supabase/info";

export interface PublicMatchEvent {
  id?: string | number;
  minute?: number;
  type?: string;
  team?: string;
  teamName?: string;
  teamNumber?: number;
  player?: { name?: string };
  assist?: { name?: string };
  card?: string;
  playerOut?: { name?: string };
  playerIn?: { name?: string };
}

export interface PublicMatch {
  id: string | number;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  status: string;
  venue?: string;
  tournament?: string;
  tournamentStage?: string;
  events: PublicMatchEvent[];
  completedAt?: string;
  updatedAt?: string;
}

const REDACTED_KEYS = new Set([
  "paymentData",
  "ownedBy",
  "scoredBy",
  "scoredBy1",
  "scoredBy2",
  "primaryScorer",
  "secondaryScorer",
  "teamScorerMapping",
  "eventScorerMapping",
  "team1FullRoster",
  "team2FullRoster",
  "team1Squad",
  "team2Squad",
]);

function redactEvent(event: Record<string, unknown>): PublicMatchEvent {
  const player = event.player as Record<string, unknown> | undefined;
  const assist = event.assist as Record<string, unknown> | undefined;
  const playerOut = event.playerOut as Record<string, unknown> | undefined;
  const playerIn = event.playerIn as Record<string, unknown> | undefined;

  return {
    id: event.id as string | number | undefined,
    minute: event.minute as number | undefined,
    type: event.type as string | undefined,
    team: event.team as string | undefined,
    teamName: event.teamName as string | undefined,
    teamNumber: event.teamNumber as number | undefined,
    card: event.card as string | undefined,
    player: player?.name ? { name: String(player.name) } : undefined,
    assist: assist?.name ? { name: String(assist.name) } : undefined,
    playerOut: playerOut?.name ? { name: String(playerOut.name) } : undefined,
    playerIn: playerIn?.name ? { name: String(playerIn.name) } : undefined,
  };
}

/** Strip internal fields from a raw match object. */
export function redactMatchForPublic(raw: Record<string, unknown> | null | undefined): PublicMatch | null {
  if (!raw || raw.id == null) return null;

  for (const key of REDACTED_KEYS) {
    if (key in raw) {
      // ensure redaction — do not copy
    }
  }

  const events = Array.isArray(raw.events)
    ? (raw.events as Record<string, unknown>[]).map(redactEvent)
    : [];

  return {
    id: raw.id as string | number,
    teamA: String(raw.teamA ?? raw.team1 ?? "Team A"),
    teamB: String(raw.teamB ?? raw.team2 ?? "Team B"),
    scoreA: Number(raw.scoreA ?? raw.team1Score ?? 0),
    scoreB: Number(raw.scoreB ?? raw.team2Score ?? 0),
    status: String(raw.status ?? "Live"),
    venue: raw.venue ? String(raw.venue) : undefined,
    tournament: raw.tournament ? String(raw.tournament) : undefined,
    tournamentStage: raw.tournamentStage ? String(raw.tournamentStage) : undefined,
    events,
    completedAt: raw.completedAt ? String(raw.completedAt) : undefined,
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
  };
}

export async function fetchPublicMatch(matchId: string): Promise<PublicMatch | null> {
  const url = `${scoringFunctionsUrl}/public/matches/${encodeURIComponent(matchId)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${publicAnonKey}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load match (${res.status})`);
  const data = await res.json();
  return redactMatchForPublic(data.match ?? data);
}

/** Polling interval for spectator live view (ms). */
export const SPECTATOR_POLL_MS = 4000;
