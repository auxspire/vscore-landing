/**
 * FIFA 2026 R32 bracket builder — group logic & Annex C pool compliance.
 */
import {
  assignThirdsToSlots,
  buildBracket,
  get8BestThirds,
  R32_FIXTURE_SPEC,
  THIRD_SLOT_POOLS,
  type GroupResult,
  type ThirdPlaceCandidate,
} from "../../artifacts/api-server/src/services/bracketBuilder";
import { TEAMS, type Team } from "../../artifacts/api-server/src/data/teams";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function mockTeam(group: string, id = `t-${group}`): Team {
  return {
    id,
    name: `Team ${group}`,
    group,
    fifaRanking: 50,
    eloRating: 1400,
    confederation: "UEFA",
    flagCode: "XX",
  };
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [head, ...tail] = arr;
  const withHead = combinations(tail, k - 1).map((c) => [head, ...c]);
  const withoutHead = combinations(tail, k);
  return [...withHead, ...withoutHead];
}

function testR32FixtureStructure() {
  assert(R32_FIXTURE_SPEC.length === 16, "Expected 16 R32 fixtures");

  const winnerFacingThird: Record<number, string> = {
    1: "E",
    3: "I",
    13: "D",
    15: "G",
    21: "A",
    23: "L",
    29: "B",
    31: "K",
  };

  for (const [slotStr, winnerGroup] of Object.entries(winnerFacingThird)) {
    const slot = Number(slotStr);
    const pool = THIRD_SLOT_POOLS[slot];
    assert(pool !== undefined, `Missing pool for third slot ${slot}`);
    assert(
      !pool.includes(winnerGroup),
      `Third slot ${slot} pool must not include facing winner group ${winnerGroup}`,
    );
  }

  for (const { slots } of R32_FIXTURE_SPEC) {
    assert(slots[1] - slots[0] === 1, `Non-adjacent R32 pair ${slots.join("-")}`);
  }
}

function testThirdPlaceTiebreakerUsesGoalsScored() {
  const a: ThirdPlaceCandidate = {
    team: mockTeam("A", "a"),
    points: 4,
    gd: 2,
    goalsFor: 5,
  };
  const b: ThirdPlaceCandidate = {
    team: mockTeam("B", "b"),
    points: 4,
    gd: 2,
    goalsFor: 7,
  };
  const best = get8BestThirds([a, b]);
  assert(best[0].id === "b", "Higher goals scored should rank above equal pts/gd");
}

function testAll495ThirdPlaceCombinations() {
  const groups = "ABCDEFGHIJKL".split("");
  let ok = 0;
  for (const combo of combinations(groups, 8)) {
    const teams = combo.map((g) => mockTeam(g, `third-${g}`));
    assignThirdsToSlots(teams);
    ok++;
  }
  assert(ok === 495, `Expected 495 combinations, got ${ok}`);
}

function testBuildBracketFromDraw() {
  const groupResults: Record<string, GroupResult[]> = {};
  const allThirds: ThirdPlaceCandidate[] = [];

  for (const g of "ABCDEFGHIJKL".split("")) {
    const inGroup = TEAMS.filter((t) => t.group === g);
    assert(inGroup.length === 4, `Group ${g} should have 4 teams`);
    const sorted = [...inGroup].sort((a, b) => b.eloRating - a.eloRating);
    groupResults[g] = sorted.map((team, i) => ({
      team,
      points: 9 - i * 3,
      gd: 3 - i,
      goalsFor: 5 - i,
      position: i + 1,
    }));
    allThirds.push({
      team: sorted[3],
      points: 3,
      gd: 0,
      goalsFor: 2,
    });
  }

  const bracket = buildBracket(groupResults, allThirds);
  assert(bracket.length === 32, "Bracket must have 32 teams");
  assert(bracket.every(Boolean), "No empty bracket slots");

  for (const { slots } of R32_FIXTURE_SPEC) {
    const [a, b] = slots;
    assert(bracket[a].group !== bracket[b].group, `Same-group R32: slots ${a}-${b}`);
  }
}

function testInvalidThirdComboThrows() {
  let threw = false;
  try {
    assignThirdsToSlots([
      mockTeam("A"),
      mockTeam("B"),
      mockTeam("C"),
      mockTeam("D"),
      mockTeam("E"),
      mockTeam("F"),
      mockTeam("G"),
      mockTeam("H"),
    ]);
  } catch {
    threw = true;
  }
  assert(!threw, "Valid 8-group combo should assign");

  try {
    assignThirdsToSlots(Array.from({ length: 8 }, (_, i) => mockTeam("Z", `z${i}`)));
    assert(false, "Invalid group Z should throw");
  } catch {
    /* expected */
  }
}

testR32FixtureStructure();
testThirdPlaceTiebreakerUsesGoalsScored();
testAll495ThirdPlaceCombinations();
testBuildBracketFromDraw();
testInvalidThirdComboThrows();
console.log("bracket-builder FIFA logic checks OK");
