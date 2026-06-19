/**
 * Unit checks for live standings → R32 opponent resolution (no API).
 */
import { TEAMS_BY_ID } from "../../artifacts/api-server/src/data/teams";
import {
  buildBracket,
  type GroupResult,
  type ThirdPlaceCandidate,
} from "../../artifacts/api-server/src/services/bracketBuilder";
import { resolveStandingR32Opponent, type LiveStandingRow, type LiveStandingsContext } from "../../artifacts/api-server/src/services/liveStandings";
import { resolveR32Anchor, type PathStage } from "@workspace/bracket-path";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function mockGroupResults(): {
  groupResults: Record<string, GroupResult[]>;
  thirds: ThirdPlaceCandidate[];
} {
  const byGroup = (group: string, ids: [string, string, string, string]) => {
    const teams = ids.map((id, i) => {
      const t = TEAMS_BY_ID[id];
      return {
        team: t,
        points: 9 - i * 3,
        gd: 3 - i,
        goalsFor: 5 - i,
        position: i + 1,
      } satisfies GroupResult;
    });
    return teams;
  };

  const groupResults: Record<string, GroupResult[]> = {};
  const thirds: ThirdPlaceCandidate[] = [];

  const setup = (group: string, ids: [string, string, string, string]) => {
    const rows = byGroup(group, ids);
    groupResults[group] = [rows[0], rows[1]];
    thirds.push({
      team: rows[2].team,
      points: rows[2].points,
      gd: rows[2].gd,
      goalsFor: rows[2].goalsFor,
    });
  };

  setup("A", ["mexico", "south_korea", "czechia", "south_africa"]);
  setup("B", ["switzerland", "canada", "qatar", "bosnia"]);
  setup("C", ["brazil", "morocco", "scotland", "haiti"]);
  setup("D", ["usa", "turkey", "australia", "paraguay"]);
  setup("E", ["ivory_coast", "germany", "ecuador", "curacao"]);
  setup("F", ["netherlands", "sweden", "japan", "tunisia"]);
  setup("G", ["belgium", "egypt", "iran", "new_zealand"]);
  setup("H", ["spain", "uruguay", "saudi_arabia", "cape_verde"]);
  setup("I", ["france", "norway", "senegal", "iraq"]);
  setup("J", ["argentina", "austria", "algeria", "jordan"]);
  setup("K", ["portugal", "colombia", "dr_congo", "uzbekistan"]);
  setup("L", ["england", "croatia", "ghana", "panama"]);

  return { groupResults, thirds };
}

function buildMockContext(): LiveStandingsContext {
  const { groupResults, thirds } = mockGroupResults();
  const bracket = buildBracket(groupResults, thirds);
  const bySimulatorId = new Map<string, LiveStandingRow>();

  for (const rows of Object.values(groupResults)) {
    for (const row of rows) {
      bySimulatorId.set(row.team.id, {
        simulatorTeamId: row.team.id,
        apiTeamId: row.team.id,
        group: row.team.group,
        rank: row.position,
        points: row.points,
        gd: row.gd,
        goalsFor: row.goalsFor,
        finish: row.position === 1 ? "1st" : "2nd",
      });
    }
  }

  for (const t of thirds.slice(0, 8)) {
    bySimulatorId.set(t.team.id, {
      simulatorTeamId: t.team.id,
      apiTeamId: t.team.id,
      group: t.team.group,
      rank: 3,
      points: t.points,
      gd: t.gd,
      goalsFor: t.goalsFor,
      finish: "3rd",
    });
  }

  return {
    bySimulatorId,
    allThirdCandidates: thirds,
    qualifiedThirdGroups: new Set(thirds.slice(0, 8).map((t) => t.team.group)),
    groupResults,
    bracket,
    asOf: new Date().toISOString(),
    available: true,
  };
}

function testGermanySecondGetsRunnerUpPairing() {
  const ctx = buildMockContext();
  const germany = TEAMS_BY_ID.germany;
  const standing = ctx.bySimulatorId.get("germany")!;
  standing.finish = "2nd";
  standing.rank = 2;

  const foe = resolveStandingR32Opponent(germany, standing, ctx);
  assert(foe !== null, "Germany 2nd must have R32 opponent");
  assert(foe!.teamId === "norway", `Expected Norway (2I), got ${foe!.name}`);
  assert(foe!.pairingType === "runner_up", "2E vs 2I must be runner_up pairing");
}

function testMexicoFirstUsesBracketMatrix() {
  const ctx = buildMockContext();
  const mexico = TEAMS_BY_ID.mexico;
  const standing = ctx.bySimulatorId.get("mexico")!;
  standing.finish = "1st";

  const foe = resolveStandingR32Opponent(mexico, standing, ctx);
  assert(foe !== null, "Mexico 1st must have R32 opponent");
  assert(foe!.pairingType === "third_place" || foe!.pairingType === "winner", "Winner slot must resolve");
}

function testEliminatedStandingNoOpponent() {
  const ctx = buildMockContext();
  const curacao = TEAMS_BY_ID.curacao;
  const standing: LiveStandingRow = {
    simulatorTeamId: "curacao",
    apiTeamId: "curacao",
    group: "E",
    rank: 4,
    points: 0,
    gd: -5,
    goalsFor: 1,
    finish: "eliminated",
  };

  const foe = resolveStandingR32Opponent(curacao, standing, ctx);
  assert(foe === null, "Eliminated team must not have standing R32 foe");
}

function testDisplayLayerStandingAnchor() {
  const path: PathStage[] = [
    {
      stage: "round_of_32",
      reachProbability: 0.9,
      teamGroupFinish: { "1st": 0.6, "2nd": 0.35 },
      topOpponents: [mockOpponent("senegal", "Senegal", "I", 0.2)],
      opponentsByFinish: {
        "2nd": [mockOpponent("norway", "Norway", "I", 0.4)],
      },
    },
  ];

  const anchor = resolveR32Anchor(path[0], "E", { finish: "2nd" }, {
    teamId: "norway",
    name: "Norway",
    group: "I",
  });
  assert(anchor?.anchor.team.id === "norway", "Forced standing foe must anchor R32");
}

function mockOpponent(id: string, name: string, group: string, enc: number): PathStage["topOpponents"][0] {
  return {
    team: { id, name, group },
    encounterProbability: enc,
    winProbabilityIfFacing: 0.55,
  };
}

testGermanySecondGetsRunnerUpPairing();
testMexicoFirstUsesBracketMatrix();
testEliminatedStandingNoOpponent();
testDisplayLayerStandingAnchor();
console.log("live-standings-path unit checks OK");
