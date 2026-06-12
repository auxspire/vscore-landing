import { Router } from "express";
import { TEAMS, TEAMS_BY_ID } from "../data/teams";
import {
  simulateMatchProbability,
  simulateTeamStageReach,
  simulateAllTeamsRankings,
  type StageProbability,
} from "../services/simulator";
import { simulateBracketExplorer } from "../services/bracketExplorer";

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
    { aId: "argentina", bId: "france",      label: "World Cup Final rematch" },
    { aId: "brazil",    bId: "argentina",   label: "El Clasico Sudamericano" },
    { aId: "england",   bId: "germany",     label: "Historic rivalry" },
    { aId: "spain",     bId: "brazil",      label: "Tiki-taka vs Samba" },
    { aId: "usa",       bId: "mexico",      label: "CONCACAF El Clasico" },
    { aId: "france",    bId: "brazil",      label: "2006 QF rematch" },
    { aId: "argentina", bId: "portugal",    label: "Messi vs Ronaldo legacy" },
    { aId: "portugal",  bId: "spain",       label: "Iberian derby" },
    { aId: "england",   bId: "argentina",   label: "Hand of God legacy" },
    { aId: "germany",   bId: "netherlands", label: "Der Klassiker" },
    { aId: "argentina", bId: "england",     label: "Wembley wonders" },
    { aId: "spain",     bId: "france",      label: "Battle of Europe" },
    { aId: "norway",    bId: "argentina",   label: "Haaland vs Messi's successors" },
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

router.get("/bracket-explorer/:teamId", (req, res) => {
  const team = TEAMS_BY_ID[req.params.teamId];
  if (!team) {
    res.status(404).json({ error: `Team not found: ${req.params.teamId}` });
    return;
  }

  const numSims = Math.min(
    20000,
    Math.max(1000, req.query.simulations ? parseInt(req.query.simulations as string, 10) : 10000)
  );

  try {
    const data = simulateBracketExplorer(req.params.teamId, numSims);

    const KNOCKOUT_STAGES = ["round_of_32", "round_of_16", "quarterfinal", "semifinal", "final"];

    /** Normalise a raw count map into probability map, returning the keys sorted desc */
    function normaliseCounts(counts: Record<string, number>): Record<string, number> {
      const total = Object.values(counts).reduce((s, n) => s + n, 0);
      if (total === 0) return {};
      return Object.fromEntries(
        Object.entries(counts)
          .map(([k, v]) => [k, v / total])
          .sort((a, b) => (b[1] as number) - (a[1] as number))
      );
    }

    const path = KNOCKOUT_STAGES.map((stage) => {
      const sd = data.stageData[stage];
      const reachProb = sd.reachCount / numSims;

      // All opponents sorted by encounter count (up to 10)
      const allOpponents = Object.values(sd.opponents)
        .sort((a, b) => b.encounterCount - a.encounterCount)
        .slice(0, 10)
        .map((o) => {
          const encounterProb = sd.reachCount > 0 ? o.encounterCount / sd.reachCount : 0;
          const winProb       = o.encounterCount > 0 ? o.winsIfFacing / o.encounterCount : 0;

          // Conditional path: stages after this one, given we beat opponent o
          const conditionalPath = KNOCKOUT_STAGES
            .filter(s => KNOCKOUT_STAGES.indexOf(s) > KNOCKOUT_STAGES.indexOf(stage))
            .map(nextStage => {
              const cp = o.conditionalPath[nextStage];
              if (!cp || cp.reachCount === 0) return null;
              const cpOpponents = Object.values(cp.opponents)
                .sort((a, b) => b.encounterCount - a.encounterCount)
                .slice(0, 5)
                .map(co => ({
                  team: co.team,
                  encounterProbability: cp.reachCount > 0 ? co.encounterCount / cp.reachCount : 0,
                  winProbabilityIfFacing: co.encounterCount > 0 ? co.winsIfFacing / co.encounterCount : 0,
                }));
              return {
                stage: nextStage,
                // Cap at 1.0 — with small samples cp.reachCount can equal winsIfFacing
                reachProbability: o.winsIfFacing > 0 ? Math.min(1, cp.reachCount / o.winsIfFacing) : 0,
                sampleCount: cp.reachCount,
                topOpponents: cpOpponents,
              };
            })
            .filter(Boolean);

          return {
            team: o.team,
            encounterProbability: encounterProb,
            winProbabilityIfFacing: winProb,
            groupFinish: normaliseCounts(o.opponentGroupFinish),
            // Overall sample count — used for low-confidence display
            sampleCount: o.encounterCount,
            conditionalPath,
          };
        });

      // For R32 only: split opponents by which team group-finish scenario leads to them
      let opponentsByFinish: Record<string, typeof allOpponents> | undefined;
      if (stage === "round_of_32") {
        opponentsByFinish = {};
        const teamFinishRaw = sd.teamGroupFinish;
        const POS_ORDER = ["1st", "2nd", "3rd"];
        for (const pos of POS_ORDER) {
          const finishCount = teamFinishRaw[pos] ?? 0;
          if (finishCount === 0) continue;
          const posOpps = Object.values(sd.opponents)
            .filter(o => (o.encountersByTeamFinish[pos] ?? 0) > 0)
            .sort((a, b) =>
              (b.encountersByTeamFinish[pos] ?? 0) - (a.encountersByTeamFinish[pos] ?? 0)
            )
            .map(o => {
              const enc  = o.encountersByTeamFinish[pos] ?? 0;
              const wins = o.winsIfFacingByTeamFinish[pos] ?? 0;
              // Per-scenario win rate: how often we beat this opponent specifically
              // when our team finished in `pos`. Falls back to overall if no data.
              const winProbScenario = enc > 0
                ? wins / enc
                : (o.encounterCount > 0 ? o.winsIfFacing / o.encounterCount : 0);
              // Reuse the full opponent data (with conditionalPath) from allOpponents
              const full = allOpponents.find(ao => ao.team.id === o.team.id);
              // Use per-scenario opponent group finish (how this opponent finished
              // specifically in simulations where our team finished `pos`)
              const scenarioGroupFinish = normaliseCounts(
                o.opponentGroupFinishByTeamFinish[pos] ?? o.opponentGroupFinish
              );
              return {
                ...(full ?? {
                  team: o.team,
                  groupFinish: scenarioGroupFinish,
                  conditionalPath: [],
                }),
                // Override with per-scenario values
                groupFinish: scenarioGroupFinish,
                encounterProbability: enc / finishCount,
                winProbabilityIfFacing: winProbScenario,
                // Expose per-scenario sample count for low-confidence display
                sampleCount: enc,
              };
            });
          if (posOpps.length > 0) opponentsByFinish[pos] = posOpps;
        }
      }

      return {
        stage,
        description: sd.description,
        reachProbability: reachProb,
        teamGroupFinish: normaliseCounts(sd.teamGroupFinish),
        topOpponents: allOpponents,
        ...(opponentsByFinish ? { opponentsByFinish } : {}),
      };
    });

    res.json({
      team,
      path,
      tournamentWinProbability: data.winCount / numSims,
      simulationsRun: numSims,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Simulation failed";
    res.status(500).json({ error: message });
  }
});

router.get("/rankings", (req, res) => {
  const numSims = Math.min(
    20000,
    Math.max(1000, req.query.simulations ? parseInt(req.query.simulations as string, 10) : 10000)
  );

  try {
    const raw = simulateAllTeamsRankings(numSims);

    const rankings = raw.map((r, i) => ({
      rank: i + 1,
      team: TEAMS_BY_ID[r.teamId],
      winProbability:       r.winProbability,
      finalProbability:     r.finalProbability,
      semifinalProbability: r.semifinalProbability,
      quarterProbability:   r.quarterProbability,
      r16Probability:       r.r16Probability,
      r32Probability:       r.r32Probability,
    }));

    res.json({ rankings, simulationsRun: numSims });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Simulation failed";
    res.status(500).json({ error: message });
  }
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
