import { describe, expect, it } from "vitest";
import { R32_FIXTURE_SPEC } from "@/lib/bracket-builder";
import { buildKnockoutBracketState, matchesByStage } from "@/lib/knockout-bracket-state";
import type { FootballFixture, FootballStanding, FootballTeam } from "@/hooks/useFootballData";

function mockTeam(id: string, group: string, name: string): FootballTeam {
  return {
    api_team_id: id,
    name_en: name,
    fifa_code: id.slice(0, 3).toUpperCase(),
    group_name: group,
    flag_url: null,
  };
}

function standing(
  group: string,
  rank: number,
  teamId: string,
  name: string,
  points: number,
): FootballStanding {
  return {
    group_name: group,
    rank,
    team_id: teamId,
    team_name: name,
    played: 3,
    won: rank === 1 ? 2 : 1,
    drawn: 0,
    lost: 0,
    goals_for: 4,
    goals_against: 1,
    goal_difference: 3,
    points,
  };
}

describe("buildKnockoutBracketState", () => {
  it("builds 16 R32 matches with placeholders when groups are incomplete", () => {
    const teams = [mockTeam("de1", "E", "Germany")];
    const standings = [standing("E", 1, "de1", "Germany", 9)];

    const state = buildKnockoutBracketState({
      standings,
      teams,
      fixtures: [],
    });

    const byStage = matchesByStage(state);
    expect(byStage.get("round_of_32")).toHaveLength(16);
    expect(byStage.get("round_of_16")).toHaveLength(8);
    expect(byStage.get("final")).toHaveLength(1);
    expect(state.groupsComplete).toBe(false);
    expect(state.matches[0].home.participant.name).toBe("Germany");
  });

  it("uses R32 fixture spec slot pairing", () => {
    expect(R32_FIXTURE_SPEC).toHaveLength(16);
    expect(R32_FIXTURE_SPEC[0].label).toBe("1E vs 3rd");
  });

  it("advances winner from finished knockout fixture", () => {
    const teams = [mockTeam("a1", "A", "Team A"), mockTeam("b1", "B", "Team B")];
    const standings = [
      standing("A", 1, "a1", "Team A", 9),
      standing("B", 2, "b1", "Team B", 6),
    ];

    const r32Fixture: FootballFixture = {
      api_fixture_id: "r32-1",
      kickoff_at: "2026-07-01T00:00:00Z",
      home_team_id: "a1",
      home_team_name: "Team A",
      away_team_id: "b1",
      away_team_name: "Team B",
      home_goals: 2,
      away_goals: 1,
      home_scorers: null,
      away_scorers: null,
      group_name: null,
      match_type: "round_of_32",
      time_elapsed: "finished",
      is_finished: true,
    };

    const state = buildKnockoutBracketState({ standings, teams, fixtures: [r32Fixture] });
    const r32 = matchesByStage(state).get("round_of_32") ?? [];
    const matched = r32.find(
      (m) =>
        (m.home.participant.apiTeamId === "a1" && m.away.participant.apiTeamId === "b1") ||
        (m.home.participant.apiTeamId === "b1" && m.away.participant.apiTeamId === "a1"),
    );
    if (matched) {
      expect(matched.winnerId).toBe("a1");
    }
  });

  it("normalizes production match_type codes (r32, qf, sf, third)", () => {
    const teams = [mockTeam("x1", "A", "Winner A"), mockTeam("x2", "B", "Runner B")];
    const standings = [
      standing("A", 1, "x1", "Winner A", 9),
      standing("B", 2, "x2", "Runner B", 6),
    ];
    const fixtures: FootballFixture[] = [
      {
        api_fixture_id: "qf-1",
        kickoff_at: null,
        home_team_id: "x1",
        home_team_name: "Winner A",
        away_team_id: "x2",
        away_team_name: "Runner B",
        home_goals: 1,
        away_goals: 0,
        home_scorers: null,
        away_scorers: null,
        group_name: null,
        match_type: "qf",
        time_elapsed: "finished",
        is_finished: true,
      },
    ];

    const state = buildKnockoutBracketState({ standings, teams, fixtures });
    const qf = matchesByStage(state).get("quarterfinal") ?? [];
    expect(qf.some((m) => m.isFinished && m.winnerId === "x1")).toBe(true);
  });

  it("shows blank scores for upcoming fixtures with API placeholder 0-0", () => {
    const teams = [mockTeam("a1", "A", "Team A"), mockTeam("b1", "B", "Team B")];
    const standings = [
      standing("A", 1, "a1", "Team A", 9),
      standing("B", 2, "b1", "Team B", 6),
    ];

    const upcoming: FootballFixture = {
      api_fixture_id: "r32-up",
      kickoff_at: "2026-07-10T00:00:00Z",
      home_team_id: "a1",
      home_team_name: "Team A",
      away_team_id: "b1",
      away_team_name: "Team B",
      home_goals: 0,
      away_goals: 0,
      home_scorers: null,
      away_scorers: null,
      group_name: null,
      match_type: "r32",
      time_elapsed: "notstarted",
      is_finished: false,
    };

    const state = buildKnockoutBracketState({ standings, teams, fixtures: [upcoming] });
    const r32 = matchesByStage(state).get("round_of_32") ?? [];
    const matched = r32.find(
      (m) => m.home.participant.apiTeamId === "a1" && m.away.participant.apiTeamId === "b1",
    );
    expect(matched?.home.score).toBeNull();
    expect(matched?.away.score).toBeNull();
  });

  it("uses official R32 fixture over projected third-place slot (Germany vs Paraguay)", () => {
    const teams = [
      mockTeam("17", "E", "Germany"),
      mockTeam("14", "D", "Paraguay"),
      mockTeam("99", "B", "Bosnia and Herzegovina"),
      mockTeam("fr1", "I", "France"),
      mockTeam("sw1", "F", "Sweden"),
    ];
    const standings = [
      standing("E", 1, "17", "Germany", 6),
      standing("D", 3, "14", "Paraguay", 4),
      standing("B", 3, "99", "Bosnia and Herzegovina", 4),
      standing("I", 1, "fr1", "France", 6),
      standing("F", 2, "sw1", "Sweden", 4),
    ];

    const r32Fixture: FootballFixture = {
      api_fixture_id: "74",
      kickoff_at: "2026-06-29T20:30:00.000Z",
      home_team_id: "17",
      home_team_name: "Germany",
      away_team_id: "14",
      away_team_name: "Paraguay",
      home_goals: 1,
      away_goals: 1,
      home_scorers: null,
      away_scorers: null,
      group_name: "R32",
      match_type: "r32",
      time_elapsed: "finished",
      is_finished: true,
    };

    const franceSwedenFixture: FootballFixture = {
      api_fixture_id: "77",
      kickoff_at: "2026-07-01T00:00:00Z",
      home_team_id: "fr1",
      home_team_name: "France",
      away_team_id: "sw1",
      away_team_name: "Sweden",
      home_goals: 0,
      away_goals: 0,
      home_scorers: null,
      away_scorers: null,
      group_name: "R32",
      match_type: "r32",
      time_elapsed: "notstarted",
      is_finished: false,
    };

    const r16Fixture: FootballFixture = {
      api_fixture_id: "89",
      kickoff_at: "2026-07-04T00:00:00Z",
      home_team_id: "14",
      home_team_name: "Paraguay",
      away_team_id: null,
      away_team_name: "Winner Match 77",
      home_goals: 0,
      away_goals: 0,
      home_scorers: null,
      away_scorers: null,
      group_name: "R16",
      match_type: "r16",
      time_elapsed: "notstarted",
      is_finished: false,
    };

    const state = buildKnockoutBracketState({
      standings,
      teams,
      fixtures: [r32Fixture, franceSwedenFixture, r16Fixture],
    });

    const r32 = matchesByStage(state).get("round_of_32") ?? [];
    const dePy = r32.find(
      (m) =>
        m.home.participant.apiTeamId === "17" && m.away.participant.apiTeamId === "14",
    );
    expect(dePy).toBeDefined();
    expect(dePy?.home.score).toBe(1);
    expect(dePy?.away.score).toBe(1);
    expect(dePy?.winnerId).toBe("14");

    const r16 = matchesByStage(state).get("round_of_16") ?? [];
    const paraguayMatch = r16.find(
      (m) =>
        m.home.participant.apiTeamId === "14" || m.away.participant.apiTeamId === "14",
    );
    expect(paraguayMatch).toBeDefined();
    const tbdSide =
      paraguayMatch!.home.participant.apiTeamId === "14"
        ? paraguayMatch!.away.participant
        : paraguayMatch!.home.participant;
    expect(tbdSide.name).toBe("Winner of France vs Sweden");
  });

  it("labels advanced-round TBD slots from feeder team names", () => {
    const teams = [mockTeam("a1", "A", "Team A"), mockTeam("b1", "B", "Team B")];
    const standings = [
      standing("A", 1, "a1", "Team A", 9),
      standing("B", 2, "b1", "Team B", 6),
    ];

    const r32Fixture: FootballFixture = {
      api_fixture_id: "r32-ab",
      kickoff_at: "2026-07-01T00:00:00Z",
      home_team_id: "a1",
      home_team_name: "Team A",
      away_team_id: "b1",
      away_team_name: "Team B",
      home_goals: 2,
      away_goals: 1,
      home_scorers: null,
      away_scorers: null,
      group_name: null,
      match_type: "r32",
      time_elapsed: "finished",
      is_finished: true,
    };

    const state = buildKnockoutBracketState({ standings, teams, fixtures: [r32Fixture] });
    const r16 = matchesByStage(state).get("round_of_16") ?? [];
    const withTeamA = r16.find(
      (m) =>
        m.home.participant.apiTeamId === "a1" || m.away.participant.apiTeamId === "a1",
    );
    expect(withTeamA).toBeDefined();
    const other = withTeamA!.home.participant.apiTeamId === "a1"
      ? withTeamA!.away.participant
      : withTeamA!.home.participant;
    expect(other.name).toMatch(/^Winner of /);
    expect(other.name).not.toMatch(/^Winner M\d/);
  });
});
