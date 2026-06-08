import { Router } from "express";
import { TEAMS, TEAMS_BY_ID } from "../data/teams";
import {
  simulateMatchProbability,
  simulateTeamStageReach,
  type StageProbability,
} from "../services/simulator";

const router = Router();

const STAGE_DESCRIPTIONS: Record<string, string> = {
  group_stage: "Group Stage",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarterfinal: "Quarterfinal",
  semifinal: "Semifinal",
  final: "Final",
};

router.get("/match-probability", (req, res) => {
  const { teamA: teamAId, teamB: teamBId, simulations } = req.query;

  if (!teamAId || !teamBId || typeof teamAId !== "string" || typeof teamBId !== "string") {
    res.status(400).json({ error: "teamA and teamB query parameters are required" });
    return;
  }

  const teamA = TEAMS_BY_ID[teamAId];
  const teamB = TEAMS_BY_ID[teamBId];

  if (!teamA) {
    res.status(400).json({ error: `Team not found: ${teamAId}` });
    return;
  }
  if (!teamB) {
    res.status(400).json({ error: `Team not found: ${teamBId}` });
    return;
  }

  const numSims = Math.min(
    20000,
    Math.max(1000, simulations ? parseInt(simulations as string, 10) : 10000)
  );

  try {
    const result = simulateMatchProbability(teamAId, teamBId, numSims);

    res.json({
      teamA,
      teamB,
      stages: result.stages,
      totalProbability: result.totalProbability,
      simulationsRun: result.simulationsRun,
      sameGroup: result.sameGroup,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Simulation failed";
    res.status(500).json({ error: message });
  }
});

router.get("/popular-matchups", (_req, res) => {
  const POPULAR_PAIRS: Array<{ aId: string; bId: string; label: string }> = [
    { aId: "argentina", bId: "france", label: "World Cup Final rematch" },
    { aId: "brazil", bId: "argentina", label: "El Clasico Sudamericano" },
    { aId: "england", bId: "germany", label: "Historic rivalry" },
    { aId: "spain", bId: "brazil", label: "Tiki-taka vs Samba" },
    { aId: "usa", bId: "mexico", label: "Concacaf El Clasico" },
    { aId: "france", bId: "brazil", label: "2006 QF rematch" },
    { aId: "portugal", bId: "spain", label: "Iberian derby" },
    { aId: "england", bId: "argentina", label: "Hand of God legacy" },
  ];

  const stageOrder = ["group_stage", "round_of_32", "round_of_16", "quarterfinal", "semifinal", "final"];

  const matchups = POPULAR_PAIRS.map(({ aId, bId, label }) => {
    const teamA = TEAMS_BY_ID[aId];
    const teamB = TEAMS_BY_ID[bId];
    if (!teamA || !teamB) return null;

    // Use fewer simulations for popular matchups (speed)
    const result = simulateMatchProbability(aId, bId, 3000);

    const bestStage = result.stages.reduce(
      (best, s) => (s.probability > best.probability ? s : best),
      result.stages[0]
    );

    return {
      teamA,
      teamB,
      totalProbability: result.totalProbability,
      mostLikelyStage: bestStage.stage,
      label,
    };
  }).filter(Boolean);

  res.json(matchups);
});

router.get("/stage-breakdown/:teamId", (req, res) => {
  const team = TEAMS_BY_ID[req.params.teamId];
  if (!team) {
    res.status(404).json({ error: `Team not found: ${req.params.teamId}` });
    return;
  }

  try {
    const reachProbs = simulateTeamStageReach(req.params.teamId, 5000);

    const stages = Object.entries(reachProbs).map(([stage, probability]) => ({
      stage,
      probability,
      description: STAGE_DESCRIPTIONS[stage] || stage,
    }));

    const stageOrder = ["group_stage", "round_of_32", "round_of_16", "quarterfinal", "semifinal", "final"];
    stages.sort((a, b) => stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage));

    res.json({ team, stages });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Simulation failed";
    res.status(500).json({ error: message });
  }
});

export default router;
