/**
 * Unit checks for bracket path coherence (no API required).
 */
import {
  assertNoDuplicatePathOpponents,
  buildLockedDisplayPath,
  buildMostLikelyDisplayPath,
  finalizeSequentialPath,
  knockoutStageIndex,
  type PathStage,
} from "@workspace/bracket-path";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function mockOpponent(
  id: string,
  name: string,
  group: string,
  enc: number,
): PathStage["topOpponents"][0] {
  return {
    team: { id, name, group },
    encounterProbability: enc,
    winProbabilityIfFacing: 0.55,
  };
}

/** Scotland at R32 then still top aggregate at R16 — must pick next foe, not leave R16 empty. */
function testEliminatedFoeSkipsToNext() {
  const path: PathStage[] = [
    {
      stage: "round_of_32",
      reachProbability: 0.94,
      topOpponents: [mockOpponent("scotland", "Scotland", "C", 0.5)],
      teamGroupFinish: { "1st": 0.8 },
    },
    {
      stage: "round_of_16",
      reachProbability: 0.78,
      topOpponents: [
        mockOpponent("scotland", "Scotland", "C", 0.4),
        mockOpponent("france", "France", "I", 0.25),
      ],
    },
    {
      stage: "quarterfinal",
      reachProbability: 0.27,
      topOpponents: [mockOpponent("brazil", "Brazil", "C", 0.3)],
    },
    {
      stage: "semifinal",
      reachProbability: 0.12,
      topOpponents: [mockOpponent("spain", "Spain", "H", 0.2)],
    },
    {
      stage: "final",
      reachProbability: 0.05,
      topOpponents: [mockOpponent("argentina", "Argentina", "J", 0.15)],
    },
  ];

  const result = buildMostLikelyDisplayPath(path, "A");
  const r32 = result.find((s) => s.stage === "round_of_32")!;
  const r16 = result.find((s) => s.stage === "round_of_16")!;
  const qf = result.find((s) => s.stage === "quarterfinal")!;

  assert(r32.topOpponents[0]?.team.id === "scotland", "R32 should be Scotland");
  assert(r16.topOpponents[0]?.team.id === "france", "R16 should skip eliminated Scotland");
  assert(r16.reachProbability > 0, "R16 reach must be > 0 when opponent exists");
  assert(qf.reachProbability <= r16.reachProbability + 1e-9, "QF reach must not exceed R16");
  assert(qf.topOpponents.length > 0, "QF should have opponent when R16 does");
}

function testGapClearsLaterStages() {
  const path: PathStage[] = [
    {
      stage: "round_of_32",
      reachProbability: 0.9,
      topOpponents: [mockOpponent("a", "Team A", "B", 0.5)],
    },
    {
      stage: "round_of_16",
      reachProbability: 0.5,
      topOpponents: [],
    },
    {
      stage: "quarterfinal",
      reachProbability: 0.27,
      topOpponents: [mockOpponent("b", "Team B", "C", 0.3)],
    },
  ];

  const result = finalizeSequentialPath(path);
  const r16 = result.find((s) => s.stage === "round_of_16")!;
  const qf = result.find((s) => s.stage === "quarterfinal")!;

  assert(r16.topOpponents.length === 0, "R16 empty");
  assert(qf.topOpponents.length === 0, "QF cleared after R16 gap");
  assert(qf.reachProbability === 0, "QF reach zero after gap");
}

function testGermanyConditionalPath() {
  const path: PathStage[] = [
    {
      stage: "round_of_32",
      reachProbability: 0.978,
      teamGroupFinish: { "1st": 0.36, "2nd": 0.35, "3rd": 0.29 },
      topOpponents: [mockOpponent("czechia", "Czechia", "A", 0.2)],
      opponentsByFinish: {
        "1st": [mockOpponent("czechia", "Czechia", "A", 0.2)],
      },
    },
    {
      stage: "round_of_16",
      reachProbability: 0.65,
      topOpponents: [mockOpponent("czechia", "Czechia", "A", 0.3)],
    },
    {
      stage: "quarterfinal",
      reachProbability: 0.4,
      topOpponents: [mockOpponent("spain", "Spain", "H", 0.25)],
    },
    {
      stage: "semifinal",
      reachProbability: 0.15,
      topOpponents: [mockOpponent("france", "France", "I", 0.2)],
    },
    {
      stage: "final",
      reachProbability: 0.06,
      topOpponents: [mockOpponent("brazil", "Brazil", "C", 0.15)],
    },
  ];

  path[0].topOpponents[0].conditionalPath = [
    {
      stage: "round_of_16",
      reachProbability: 0.72,
      topOpponents: [mockOpponent("netherlands", "Netherlands", "F", 0.35)],
    },
    {
      stage: "quarterfinal",
      reachProbability: 0.38,
      topOpponents: [mockOpponent("spain", "Spain", "H", 0.25)],
    },
  ];
  if (path[0].opponentsByFinish?.["1st"]?.[0]) {
    path[0].opponentsByFinish["1st"][0].conditionalPath = path[0].topOpponents[0].conditionalPath;
  }

  const result = buildMostLikelyDisplayPath(path, "E");
  const r16 = result.find((s) => s.stage === "round_of_16")!;
  const qf = result.find((s) => s.stage === "quarterfinal")!;

  assert(r16.topOpponents.length > 0, "R16 must have opponent via conditional path");
  assert(r16.topOpponents[0]?.team.id !== "czechia", "R16 must not repeat R32 foe");
  assert(r16.reachProbability > 0, "R16 reach must be > 0");
  assert(qf.topOpponents.length > 0, "QF must have opponent");
  assert(qf.reachProbability <= r16.reachProbability + 1e-9, "QF reach must not exceed R16");
  assert(r16.pathProjection === "projected", "R16 should be marked projected path");
  assert(r16.isConditional === true, "R16 should keep conditional reach semantics");
}

function testLockAtR16NoDuplicateR32() {
  const path: PathStage[] = [
    {
      stage: "round_of_32",
      reachProbability: 0.9,
      topOpponents: [mockOpponent("portugal", "Portugal", "G", 0.4)],
    },
    {
      stage: "round_of_16",
      reachProbability: 0.6,
      topOpponents: [
        mockOpponent("spain", "Spain", "H", 0.35),
        mockOpponent("portugal", "Portugal", "G", 0.1),
      ],
    },
    {
      stage: "quarterfinal",
      reachProbability: 0.3,
      topOpponents: [mockOpponent("brazil", "Brazil", "C", 0.2)],
    },
  ];

  const result = buildLockedDisplayPath({
    path,
    teamGroup: "E",
    lockedStage: "round_of_16",
    lockedOpponentId: "spain",
    lockedFinishPos: null,
  });

  const dupes = assertNoDuplicatePathOpponents(
    result.stages,
    knockoutStageIndex("round_of_16"),
    "spain",
  );
  assert(dupes.length === 0, `R16 lock must not duplicate earlier foes: ${dupes.join("; ")}`);

  const qf = result.stages.find((s) => s.stage === "quarterfinal")!;
  assert(
    qf.topOpponents[0]?.team.id !== "portugal",
    "QF must not repeat R32 foe eliminated before lock",
  );
}

function testSparseConditionalUsesAggregateFallback() {
  const path: PathStage[] = [
    {
      stage: "round_of_32",
      reachProbability: 0.95,
      teamGroupFinish: { "1st": 0.7 },
      topOpponents: [mockOpponent("czechia", "Czechia", "A", 0.3)],
      opponentsByFinish: {
        "1st": [mockOpponent("czechia", "Czechia", "A", 0.3)],
      },
    },
    {
      stage: "round_of_16",
      reachProbability: 0.7,
      topOpponents: [
        mockOpponent("czechia", "Czechia", "A", 0.2),
        mockOpponent("france", "France", "I", 0.15),
      ],
    },
    {
      stage: "quarterfinal",
      reachProbability: 0.35,
      topOpponents: [mockOpponent("brazil", "Brazil", "C", 0.25)],
    },
  ];

  path[0].topOpponents[0].conditionalPath = [
    {
      stage: "quarterfinal",
      reachProbability: 0.4,
      topOpponents: [mockOpponent("spain", "Spain", "H", 0.2)],
    },
  ];
  if (path[0].opponentsByFinish?.["1st"]?.[0]) {
    path[0].opponentsByFinish["1st"][0].conditionalPath = path[0].topOpponents[0].conditionalPath;
  }

  const result = buildMostLikelyDisplayPath(path, "E");
  const r16 = result.find((s) => s.stage === "round_of_16")!;
  assert(r16.topOpponents.length > 0, "R16 must fall back to aggregate when conditional skips it");
  assert(r16.topOpponents[0]?.team.id !== "czechia", "R16 must not repeat R32 foe");
}

testEliminatedFoeSkipsToNext();
testGapClearsLaterStages();
testGermanyConditionalPath();
testLockAtR16NoDuplicateR32();
testSparseConditionalUsesAggregateFallback();
console.log("path-coherence unit checks OK");
