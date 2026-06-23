import { describe, expect, it } from "vitest";
import {
  canStartMatch,
  getSquadWarningMessage,
  hasDuplicatePlayerName,
  isDuplicateTeamName,
  isNewMatchFormReady,
  isSameTeamInMatch,
  isSquadComplete,
  isValidMatchFormat,
  validateRecordedEvent,
} from "./matchValidation";

describe("matchValidation", () => {
  it("detects duplicate team names case-insensitively", () => {
    const teams = [{ name: "Sunday FC" }];
    expect(isDuplicateTeamName(teams, "sunday fc")).toBe(true);
    expect(isDuplicateTeamName(teams, "Monday FC")).toBe(false);
  });

  it("blocks same team in a match", () => {
    expect(isSameTeamInMatch("Sunday FC", "Sunday FC")).toBe(true);
    expect(isSameTeamInMatch("Sunday FC", "Monday FC")).toBe(false);
  });

  it("validates squad completeness", () => {
    expect(isSquadComplete(7, 7)).toBe(true);
    expect(isSquadComplete(5, 7)).toBe(false);
    expect(getSquadWarningMessage("Team A", 5, 7)).toBe(
      "Please add 2 more players to Team A",
    );
    expect(canStartMatch(7, 7, 7)).toBe(true);
    expect(canStartMatch(6, 7, 7)).toBe(false);
  });

  it("detects duplicate player names", () => {
    const players = [{ name: "Rahul" }];
    expect(hasDuplicatePlayerName(players, "rahul")).toBe(true);
    expect(hasDuplicatePlayerName(players, "Aditya")).toBe(false);
  });

  it("accepts only single and halves match formats", () => {
    expect(isValidMatchFormat("single")).toBe(true);
    expect(isValidMatchFormat("halves")).toBe(true);
    expect(isValidMatchFormat("quarters")).toBe(false);
  });

  it("gates new match form per PRD rules", () => {
    const valid = {
      team1: "Team A",
      team2: "Team B",
      matchFormat: "single",
      duration: "60",
      playersPerTeam: "7",
      scoringLevel: "basic",
    };
    expect(isNewMatchFormReady(valid)).toBe(true);
    expect(isNewMatchFormReady({ ...valid, team2: "Team A" })).toBe(false);
    expect(isNewMatchFormReady({ ...valid, playersPerTeam: "" })).toBe(false);
    expect(isNewMatchFormReady({ ...valid, duration: "4" })).toBe(false);
  });

  it("validates recorded events", () => {
    expect(validateRecordedEvent({ type: "goal", player: { name: "Rahul" } })).toEqual([]);
    expect(validateRecordedEvent({ type: "goal" })).toContain("Goal requires a scorer");
    expect(
      validateRecordedEvent({
        type: "substitution",
        playerOut: { name: "A" },
        playerIn: { name: "B" },
      }),
    ).toEqual([]);
  });
});
