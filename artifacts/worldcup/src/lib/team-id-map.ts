import type { Team } from "@workspace/api-client-react";
import type { FootballTeam } from "@/hooks/useFootballData";

function normalizeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Map Supabase football_teams.api_team_id → simulator slug (e.g. morocco). */
export function buildApiToSimulatorMap(
  simTeams: Team[],
  footballTeams: FootballTeam[],
): Map<string, string> {
  const byFifa = new Map<string, string>();
  const byName = new Map<string, string>();

  for (const t of simTeams) {
    const fifa = t.flagCode.replace(/-.*/, "").toUpperCase();
    byFifa.set(fifa, t.id);
    byName.set(normalizeName(t.name), t.id);
    byName.set(normalizeName(t.id.replace(/_/g, " ")), t.id);
  }

  const map = new Map<string, string>();
  for (const ft of footballTeams) {
    const fifa = ft.fifa_code?.toUpperCase();
    if (fifa && byFifa.has(fifa)) {
      map.set(ft.api_team_id, byFifa.get(fifa)!);
      continue;
    }
    const norm = normalizeName(ft.name_en);
    if (byName.has(norm)) {
      map.set(ft.api_team_id, byName.get(norm)!);
    }
  }
  return map;
}
