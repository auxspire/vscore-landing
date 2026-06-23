import { describe, expect, it } from "vitest";
import { aggregatePlayerStats, aggregateTeamStats } from "./statsAggregation";

describe("statsAggregation", () => {
  const completedMatches = [
    {
      id: 1,
      team1: "Sunday FC",
      team2: "Monday FC",
      scoreA: 2,
      scoreB: 1,
      events: [
        { type: "goal", team: "Sunday FC", player: { id: 1, name: "Rahul" } },
        {
          type: "goal",
          team: "Sunday FC",
          player: { id: 2, name: "Aditya" },
          assist: { id: 1, name: "Rahul" },
        },
        { type: "goal", team: "Monday FC", player: { id: 3, name: "Vishnu" } },
      ],
    },
  ];

  it("aggregates player goals and assists from real match events only", () => {
    const players = aggregatePlayerStats(completedMatches);
    expect(players).toHaveLength(3);
    expect(players[0]).toMatchObject({ name: "Rahul", goals: 1, assists: 1 });
    expect(players.find((p) => p.name === "Aditya")?.goals).toBe(1);
    expect(players.find((p) => p.name === "Vishnu")?.goals).toBe(1);
  });

  it("returns empty arrays when no completed matches", () => {
    expect(aggregatePlayerStats([])).toEqual([]);
    expect(aggregateTeamStats([])).toEqual([]);
  });

  it("aggregates team points from scores", () => {
    const teams = aggregateTeamStats(completedMatches);
    expect(teams[0]).toMatchObject({ name: "Sunday FC", wins: 1, points: 3, gf: 2 });
    expect(teams.find((t) => t.name === "Monday FC")).toMatchObject({
      losses: 1,
      points: 0,
      gf: 1,
    });
  });
});
