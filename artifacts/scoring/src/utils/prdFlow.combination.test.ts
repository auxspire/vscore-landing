import { describe, expect, it } from "vitest";
import {
  canStartMatch,
  hasDuplicatePlayerName,
  isDuplicateTeamName,
  isNewMatchFormReady,
  isSameTeamInMatch,
  validateRecordedEvent,
} from "./matchValidation";
import { aggregatePlayerStats } from "./statsAggregation";

/**
 * Combination test: PRD core loop logic without UI.
 * Teams → Match → Squads → Events → Results stats
 */
describe("PRD core flow (combination)", () => {
  it("runs Sunday FC vs Monday FC friendly match end-to-end", () => {
    // 1. Team management
    const teams: Array<{ id: number; name: string; players: Array<{ id: number; name: string }> }> =
      [];

    const registerTeam = (name: string, playerNames: string[]) => {
      expect(isDuplicateTeamName(teams, name)).toBe(false);
      const team = {
        id: teams.length + 1,
        name,
        players: playerNames.map((n, i) => ({ id: i + 1, name: n })),
      };
      teams.push(team);
      return team;
    };

    const sunday = registerTeam("Sunday FC", [
      "P1",
      "P2",
      "P3",
      "P4",
      "P5",
      "P6",
      "P7",
      "P8",
    ]);
    const monday = registerTeam("Monday FC", [
      "M1",
      "M2",
      "M3",
      "M4",
      "M5",
      "M6",
      "M7",
      "M8",
    ]);

    expect(teams).toHaveLength(2);
    expect(isDuplicateTeamName(teams, "Sunday FC")).toBe(true);

    // 2. Player duplicate warning path
    const allPlayers = teams.flatMap((t) => t.players.map((p) => ({ name: p.name })));
    expect(hasDuplicatePlayerName(allPlayers, "P1")).toBe(true);

    // 3. New match (friendly defaults: basic scoring, 7 per side, single)
    const playersPerTeam = 7;
    const matchSetup = {
      team1: sunday.name,
      team2: monday.name,
      matchFormat: "single" as const,
      duration: "60",
      playersPerTeam: String(playersPerTeam),
      scoringLevel: "basic",
    };
    expect(isSameTeamInMatch(matchSetup.team1, matchSetup.team2)).toBe(false);
    expect(isNewMatchFormReady(matchSetup)).toBe(true);

    // 4. Squad selection — exactly 7 each
    const squad1 = sunday.players.slice(0, playersPerTeam);
    const squad2 = monday.players.slice(0, playersPerTeam);
    expect(canStartMatch(squad1.length, squad2.length, playersPerTeam)).toBe(true);
    expect(canStartMatch(6, squad2.length, playersPerTeam)).toBe(false);

    // 5. Live scoring events
    const events = [
      {
        minute: 12,
        type: "goal",
        team: sunday.name,
        player: squad1[0],
        assist: squad1[1],
      },
      {
        minute: 34,
        type: "foul",
        team: monday.name,
        player: squad2[0],
        card: "yellow" as const,
      },
      {
        minute: 55,
        type: "substitution",
        team: sunday.name,
        playerOut: squad1[6],
        playerIn: sunday.players[7],
      },
      {
        minute: 67,
        type: "goal",
        team: monday.name,
        player: squad2[2],
        assist: null,
      },
    ];

    for (const event of events) {
      expect(validateRecordedEvent(event)).toEqual([]);
    }

    // 6. Match results — stats from recorded events only
    const completedMatch = {
      id: 100,
      team1: sunday.name,
      team2: monday.name,
      scoreA: 1,
      scoreB: 1,
      events: events.filter((e) => e.type === "goal"),
    };

    const leaderboard = aggregatePlayerStats([completedMatch]);
    expect(leaderboard.some((p) => p.name === "Rashford")).toBe(false);
    expect(leaderboard.find((p) => p.name === "P1")).toMatchObject({ goals: 1, assists: 0 });
    expect(leaderboard.find((p) => p.name === squad1[1].name)?.assists).toBe(1);
    expect(leaderboard.find((p) => p.name === "M3")?.goals).toBe(1);
  });
});
