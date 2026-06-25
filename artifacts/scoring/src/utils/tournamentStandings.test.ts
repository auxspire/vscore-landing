import { describe, expect, it } from "vitest";
import { calculateStandings } from "./tournamentStandings";

describe("calculateStandings", () => {
  const tournament = {
    participatingTeams: ["Alpha", "Beta", "Gamma"],
    pointsSystem: { win: 3, draw: 1, loss: 0 },
  };

  it("computes round-robin table", () => {
    const matches = [
      { team1: "Alpha", team2: "Beta", scoreA: 2, scoreB: 0, status: "Full Time", tournamentId: 1 },
      { team1: "Beta", team2: "Gamma", scoreA: 1, scoreB: 1, status: "Full Time", tournamentId: 1 },
      { team1: "Alpha", team2: "Gamma", scoreA: 3, scoreB: 2, status: "Full Time", tournamentId: 1 },
    ];
    const table = calculateStandings(tournament, matches);
    expect(table[0].team).toBe("Alpha");
    expect(table[0].points).toBe(6);
    expect(table.find((r) => r.team === "Beta")?.drawn).toBe(1);
  });

  it("excludes incomplete matches", () => {
    const matches = [
      { team1: "Alpha", team2: "Beta", scoreA: 1, scoreB: 0, status: "Live", tournamentId: 1 },
    ];
    const table = calculateStandings(tournament, matches);
    expect(table.every((r) => r.played === 0)).toBe(true);
  });
});
