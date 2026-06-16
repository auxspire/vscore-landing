import { TEAMS, GROUPS, TEAMS_BY_ID, type Team } from "../data/teams";
import type { EloAdjustments } from "./liveMetrics";

export function getAdjustedTeamsContext(adjustments?: EloAdjustments) {
  if (!adjustments || Object.keys(adjustments).length === 0) {
    return { teams: TEAMS, groups: GROUPS, teamsById: TEAMS_BY_ID };
  }
  const teams = TEAMS.map((t) => ({
    ...t,
    eloRating: t.eloRating + (adjustments[t.id] ?? 0),
  }));
  const teamsById: Record<string, Team> = Object.fromEntries(teams.map((t) => [t.id, t]));
  const groups = teams.reduce<Record<string, Team[]>>((acc, team) => {
    if (!acc[team.group]) acc[team.group] = [];
    acc[team.group].push(team);
    return acc;
  }, {});
  return { teams, groups, teamsById };
}
