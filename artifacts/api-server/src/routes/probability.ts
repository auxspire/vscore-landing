import { Router } from "express";
import { TEAMS, TEAMS_BY_ID } from "../data/teams";
import {
  simulateMatchProbability,
  simulateTeamStageReach,
  simulateAllTeamsRankings,
  type StageProbability,
} from "../services/simulator";
import { simulateBracketExplorer, type BracketOpponentData, type BracketStageData } from "../services/bracketExplorer";
import {
  buildConditionalPathResponse,
  canGroupFinishesMeetAtStage,
  canTeamFaceGroupAtStage,
  topFinishKey,
  type GroupFinish,
  type KnockoutStage,
} from "@workspace/bracket-path";
import { getLiveEloAdjustments, parseUseLiveMetrics } from "../services/liveMetrics";
import { predictFixtures } from "../services/fixturePredictions";

const router = Router();

function parseSimulationCount(raw: unknown, defaultVal = 10000): number {
  if (raw == null || raw === "") return defaultVal;
  const n = parseInt(String(raw), 10);
  if (!Number.isFinite(n)) return defaultVal;
  return Math.min(20000, Math.max(1000, n));
}

const STAGE_DESCRIPTIONS: Record<string, string> = {
  group_stage: "Group Stage",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarterfinal: "Quarterfinal",
  semifinal: "Semifinal",
  final: "Final",
};

router.get("/match-probability", async (req, res) => {
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

  const numSims = parseSimulationCount(simulations);

  try {
    const adjustments = parseUseLiveMetrics(req.query.useLiveMetrics)
      ? await getLiveEloAdjustments()
      : undefined;
    const result = simulateMatchProbability(teamAId, teamBId, numSims, adjustments);

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

    // Use fewer simulations for popular matchups (speed) but enough for stable previews
    const result = simulateMatchProbability(aId, bId, 5000);

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

router.get("/bracket-explorer/:teamId", async (req, res) => {
  const team = TEAMS_BY_ID[req.params.teamId];
  if (!team) {
    res.status(404).json({ error: `Team not found: ${req.params.teamId}` });
    return;
  }

  const numSims = parseSimulationCount(req.query.simulations);

  try {
    const adjustments = parseUseLiveMetrics(req.query.useLiveMetrics)
      ? await getLiveEloAdjustments()
      : undefined;
    const data = simulateBracketExplorer(req.params.teamId, numSims, adjustments);

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

    function teamFinishForOpponent(
      sd: BracketStageData,
      o: BracketOpponentData,
    ): GroupFinish | null {
      return topFinishKey(o.encountersByTeamFinish) ?? topFinishKey(sd.teamGroupFinish);
    }

    function conditionalSourceForOpponent(
      o: BracketOpponentData,
      teamFinish: GroupFinish | null,
    ): BracketOpponentData["conditionalPath"] {
      if (teamFinish && o.conditionalPathByTeamFinish[teamFinish]) {
        return o.conditionalPathByTeamFinish[teamFinish];
      }
      return o.conditionalPath;
    }

    const path = KNOCKOUT_STAGES.map((stage) => {
      const sd = data.stageData[stage];
      const reachProb = sd.reachCount / numSims;
      const likelyTeamFinish = topFinishKey(sd.teamGroupFinish);

      const stageOpponents = Object.values(sd.opponents).filter((o) => {
        const knockoutStage = stage as KnockoutStage;
        if (stage === "round_of_32") {
          if (!likelyTeamFinish) return true;
          const oppFinish = topFinishKey(o.opponentGroupFinish);
          if (!oppFinish) return true;
          return canGroupFinishesMeetAtStage(
            team.group,
            likelyTeamFinish,
            o.team.group,
            oppFinish,
            knockoutStage,
          );
        }
        return (["1st", "2nd", "3rd"] as GroupFinish[]).some((teamFinish) =>
          canTeamFaceGroupAtStage(team.group, teamFinish, o.team.group, knockoutStage),
        );
      });

      // All opponents sorted by encounter count (up to 10)
      const allOpponents = stageOpponents
        .sort((a, b) => b.encounterCount - a.encounterCount)
        .slice(0, 10)
        .map((o) => {
          const encounterProb = sd.reachCount > 0 ? o.encounterCount / sd.reachCount : 0;
          const winProb       = o.encounterCount > 0 ? o.winsIfFacing / o.encounterCount : 0;

          const teamFinishForO = teamFinishForOpponent(sd, o);
          const winsDenominator = teamFinishForO
            ? (o.winsIfFacingByTeamFinish[teamFinishForO] ?? o.winsIfFacing)
            : o.winsIfFacing;

          const conditionalPath = buildConditionalPathResponse(
            stage,
            winsDenominator,
            conditionalSourceForOpponent(o, teamFinishForO),
            teamFinishForO
              ? {
                  teamGroup: team.group,
                  teamFinish: teamFinishForO,
                }
              : undefined,
          );

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
            .filter((o) => {
              const oppFinish = topFinishKey(
                o.opponentGroupFinishByTeamFinish[pos] ?? o.opponentGroupFinish,
              );
              if (!oppFinish) return true;
              return canGroupFinishesMeetAtStage(
                team.group,
                pos as GroupFinish,
                o.team.group,
                oppFinish,
                stage as KnockoutStage,
              );
            })
            .sort((a, b) =>
              (b.encountersByTeamFinish[pos] ?? 0) - (a.encountersByTeamFinish[pos] ?? 0)
            )
            .map(o => {
              const enc  = o.encountersByTeamFinish[pos] ?? 0;
              const wins = o.winsIfFacingByTeamFinish[pos] ?? 0;
              const winProbScenario = enc > 0
                ? wins / enc
                : (o.encounterCount > 0 ? o.winsIfFacing / o.encounterCount : 0);
              const scenarioGroupFinish = normaliseCounts(
                o.opponentGroupFinishByTeamFinish[pos] ?? o.opponentGroupFinish
              );
              const scenarioConditionalSource =
                o.conditionalPathByTeamFinish[pos] ?? o.conditionalPath;
              const conditionalPath = buildConditionalPathResponse(
                stage,
                wins,
                scenarioConditionalSource,
                {
                  teamGroup: team.group,
                  teamFinish: pos as GroupFinish,
                },
              );
              return {
                team: o.team,
                groupFinish: scenarioGroupFinish,
                encounterProbability: enc / finishCount,
                winProbabilityIfFacing: winProbScenario,
                sampleCount: enc,
                conditionalPath,
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

router.get("/rankings", async (req, res) => {
  const numSims = parseSimulationCount(req.query.simulations);

  try {
    const adjustments = parseUseLiveMetrics(req.query.useLiveMetrics)
      ? await getLiveEloAdjustments()
      : undefined;
    const raw = simulateAllTeamsRankings(numSims, adjustments);

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

router.get("/stage-breakdown/:teamId", async (req, res) => {
  const team = TEAMS_BY_ID[req.params.teamId];
  if (!team) {
    res.status(404).json({ error: `Team not found: ${req.params.teamId}` });
    return;
  }

  try {
    const adjustments = parseUseLiveMetrics(req.query.useLiveMetrics)
      ? await getLiveEloAdjustments()
      : undefined;
    const reachProbs = simulateTeamStageReach(req.params.teamId, 10000, adjustments);

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

router.post("/fixture-predictions", async (req, res) => {
  const body = req.body as {
    fixtures?: Array<{
      fixtureId: string;
      homeFifaCode?: string | null;
      homeName?: string | null;
      awayFifaCode?: string | null;
      awayName?: string | null;
      matchType?: string | null;
      isFinished?: boolean;
      homeGoals?: number | null;
      awayGoals?: number | null;
    }>;
    useLiveMetrics?: string;
  };

  if (!Array.isArray(body.fixtures) || body.fixtures.length === 0) {
    res.status(400).json({ error: "fixtures array is required" });
    return;
  }

  if (body.fixtures.length > 50) {
    res.status(400).json({ error: "Maximum 50 fixtures per request" });
    return;
  }

  try {
    const adjustments = parseUseLiveMetrics(body.useLiveMetrics)
      ? await getLiveEloAdjustments()
      : undefined;
    const predictions = predictFixtures(body.fixtures, adjustments);
    res.json({ predictions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Prediction failed";
    res.status(500).json({ error: message });
  }
});

export default router;
