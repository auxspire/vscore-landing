/**
 * Unit checks for bracket path coherence (no API required).
 */
import {
  buildMostLikelyDisplayPath,
  finalizeSequentialPath,
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

testEliminatedFoeSkipsToNext();
testGapClearsLaterStages();
console.log("path-coherence unit checks OK");
