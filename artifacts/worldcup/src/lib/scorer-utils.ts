/** Parse worldcup26 scorer payloads into display names. */

const NAME_KEYS = ["name", "name_en", "player_name", "player_name_en", "scorer", "player"] as const;

function stripMinutePrefix(text: string): string {
  return text.replace(/^\d+(?:\+\d+)?['′]\s*/i, "").trim();
}

/** Strip minute markers and penalty/OG suffixes for display and deduplication. */
export function prettifyScorerName(name: string): string {
  let s = name.trim();
  s = s.replace(/^\d+(?:\+\d+)?['′]\s*/i, "").trim();
  s = s.replace(/\s+\d+(?:\+\d+)?['′]?(?:\s*\([pP]\))?$/i, "").trim();
  s = s.replace(/\s*\([pP]\)\s*$/i, "").trim();
  s = s.replace(/\s*['′]?\s*\([oO][gG]\)\s*$/i, "").trim();
  return s;
}

function foldAccents(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "");
}

/** Stable key for one player on one team across matches and goal events. */
export function canonicalScorerKey(name: string): string {
  return foldAccents(prettifyScorerName(name).toLowerCase()).replace(/\s+/g, " ").trim();
}

function teamAggregationKey(teamId: string | null, teamName: string | null): string {
  if (teamId?.trim()) return teamId.trim().toLowerCase();
  return (teamName ?? "").trim().toLowerCase();
}

function displayNameQuality(name: string): number {
  const pretty = prettifyScorerName(name);
  let score = pretty.length;
  if (/\d/.test(pretty)) score -= 50;
  if (/['′]/.test(pretty)) score -= 30;
  return score;
}

function pickBetterDisplayName(current: string, candidate: string): string {
  const curPretty = prettifyScorerName(current);
  const candPretty = prettifyScorerName(candidate);
  return displayNameQuality(candPretty) > displayNameQuality(curPretty) ? candPretty : curPretty;
}

function extractNameFromJsonish(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    const parsed = JSON.parse(trimmed);
    const fromParsed = scorerDisplayName(parsed);
    return fromParsed === "Unknown" ? null : fromParsed;
  } catch {
    const quoted = trimmed.match(/"(?:name|name_en|player_name|player_name_en|scorer|player)"\s*:\s*"([^"]+)"/i);
    if (quoted?.[1]) return prettifyScorerName(stripMinutePrefix(quoted[1]));
    return null;
  }
}

function looksMalformed(name: string): boolean {
  const t = name.trim();
  return t.startsWith("{") || t.startsWith("[") || t.includes('"raw"') || t.includes("=>");
}

export function scorerDisplayName(entry: unknown): string {
  if (entry == null) return "Unknown";

  if (typeof entry === "string") {
    const trimmed = entry.trim();
    if (!trimmed || trimmed.toLowerCase() === "null") return "Unknown";

    const fromJson = extractNameFromJsonish(trimmed);
    if (fromJson) return fromJson;

    const tick = trimmed.match(/^\d+(?:\+\d+)?['′]\s*(.+)$/i);
    if (tick?.[1]) return prettifyScorerName(stripMinutePrefix(tick[1]));

    return prettifyScorerName(stripMinutePrefix(trimmed));
  }

  if (typeof entry === "object") {
    const o = entry as Record<string, unknown>;

    if (o.player != null && typeof o.player !== "string") {
      const nested = scorerDisplayName(o.player);
      if (nested !== "Unknown") return nested;
    }

    for (const key of NAME_KEYS) {
      const val = o[key];
      if (typeof val === "string" && val.trim()) {
        return prettifyScorerName(stripMinutePrefix(val.trim()));
      }
    }

    if (typeof o.raw === "string") return scorerDisplayName(o.raw);
  }

  return "Unknown";
}

function normalizeScorerRaw(raw: string): string {
  return raw
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .trim();
}

function extractQuotedScorerSegments(inner: string): string[] {
  const results: string[] = [];
  const re = /"((?:\\.|[^"\\])*)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(inner)) !== null) {
    const value = match[1].replace(/\\"/g, '"').trim();
    if (value && value.toLowerCase() !== "null") results.push(value);
  }
  return results;
}

/** Parse worldcup26 / Supabase scorer blobs into a flat list of entries. */
export function parseScorerBlob(raw: string | null): unknown[] {
  if (!raw || raw === "null" || raw.trim() === "") return [];

  const normalized = normalizeScorerRaw(raw);

  try {
    const parsed = JSON.parse(normalized);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") return Object.values(parsed as Record<string, unknown>);
    if (typeof parsed === "string") return parseScorerBlob(parsed);
    return [];
  } catch {
    const trimmed = normalized.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const quoted = extractQuotedScorerSegments(trimmed.slice(1, -1));
      if (quoted.length > 0) return quoted;
    }
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        /* fall through */
      }
    }
    if (/^\d+['′]/.test(trimmed) || /['′]\s*$/.test(trimmed)) return [trimmed];
    if (trimmed.length > 0 && trimmed.toLowerCase() !== "null") return [trimmed];
    return [];
  }
}

/** Normalise JSONB / API scorer fields (array, string blob, or null). */
export function coerceScorerField(raw: unknown): unknown[] | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    if (raw.length === 0) return null;
    const flat: unknown[] = [];
    for (const item of raw) {
      if (typeof item === "string") flat.push(...parseScorerBlob(item));
      else flat.push(item);
    }
    return flat.length > 0 ? flat : null;
  }
  if (typeof raw === "string") {
    const parsed = parseScorerBlob(raw);
    return parsed.length > 0 ? parsed : null;
  }
  if (typeof raw === "object") return [raw];
  return null;
}

export function normalizeScorerList(raw: unknown[] | null): unknown[] {
  if (!raw?.length) return [];
  const flat: unknown[] = [];

  for (const item of raw) {
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        flat.push(...parseScorerBlob(trimmed));
        continue;
      }
    }
    flat.push(item);
  }

  return flat;
}

export interface ScorerEntry {
  id: string;
  name: string;
  goals: number;
  teamName?: string;
  matches: number;
}

type ScorerAccumulator = ScorerEntry & { matchIds: Set<string> };

export function aggregateTopScorers(
  fixtures: Array<{
    api_fixture_id?: string;
    is_finished: boolean;
    home_scorers: unknown[] | null;
    away_scorers: unknown[] | null;
    home_team_name: string | null;
    away_team_name: string | null;
    home_team_id: string | null;
    away_team_id: string | null;
  }>,
  limit = 20,
): ScorerEntry[] {
  const counts = new Map<string, ScorerAccumulator>();

  for (const f of fixtures.filter((x) => x.is_finished)) {
    const matchId = f.api_fixture_id ?? `${f.home_team_id ?? f.home_team_name}-${f.away_team_id ?? f.away_team_name}-${f.is_finished}`;

    for (const side of [
      { scorers: f.home_scorers, team: f.home_team_name, teamId: f.home_team_id },
      { scorers: f.away_scorers, team: f.away_team_name, teamId: f.away_team_id },
    ]) {
      const teamKey = teamAggregationKey(side.teamId, side.team);

      for (const raw of normalizeScorerList(side.scorers)) {
        const name = prettifyScorerName(scorerDisplayName(raw));
        if (!name || name === "Unknown" || looksMalformed(name)) continue;

        const playerKey = canonicalScorerKey(name);
        if (!playerKey) continue;

        const key = `${playerKey}|${teamKey}`;
        const cur =
          counts.get(key) ??
          ({
            id: key,
            name,
            goals: 0,
            teamName: side.team ?? undefined,
            matches: 0,
            matchIds: new Set<string>(),
          } satisfies ScorerAccumulator);

        cur.goals += 1;
        cur.name = pickBetterDisplayName(cur.name, name);
        cur.matchIds.add(matchId);
        counts.set(key, cur);
      }
    }
  }

  return [...counts.values()]
    .map(({ matchIds, ...entry }) => ({
      ...entry,
      matches: matchIds.size,
    }))
    .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))
    .slice(0, limit);
}
