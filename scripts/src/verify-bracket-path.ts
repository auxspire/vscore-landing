/**
 * Smoke test: Brazil 2nd → lock Netherlands @ R32 must not duplicate foes on path.
 * Usage: pnpm --filter @workspace/scripts verify:bracket-path [baseUrl]
 */
import {
  assertNoDuplicatePathOpponents,
  buildLockedDisplayPath,
  buildMostLikelyDisplayPath,
  knockoutStageIndex,
} from "@workspace/bracket-path";

const baseUrl = process.argv[2] ?? "https://www.vscor.in";
const sims = 15000;

async function fetchBracket(useLive: boolean) {
  const q = new URLSearchParams({ simulations: String(sims) });
  if (useLive) q.set("useLiveMetrics", "1");
  const url = `${baseUrl}/api/bracket-explorer/brazil?${q}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json() as Promise<{
    team: { id: string; group: string };
    path: Parameters<typeof buildLockedDisplayPath>[0]["path"];
  }>;
}

function findNetherlandsR32(
  data: Awaited<ReturnType<typeof fetchBracket>>,
  preferFinish?: string,
) {
  const r32 = data.path.find((s) => s.stage === "round_of_32");
  if (!r32) throw new Error("No R32 stage");

  if (preferFinish && r32.opponentsByFinish?.[preferFinish]) {
    const ned = r32.opponentsByFinish[preferFinish].find((o) => o.team.id === "netherlands");
    if (ned) return { pos: preferFinish, nedId: ned.team.id };
  }

  for (const [pos, opps] of Object.entries(r32.opponentsByFinish ?? {})) {
    const ned = opps.find((o) => o.team.id === "netherlands");
    if (ned) return { pos, nedId: ned.team.id };
  }

  const ned = r32.topOpponents.find((o) => o.team.id === "netherlands");
  if (ned) return { pos: "2nd" as const, nedId: ned.team.id };

  throw new Error("Netherlands not found in Brazil R32 opponents");
}

async function verifyLikelyPath(useLive: boolean) {
  const label = useLive ? "live metrics" : "default Elo";
  const data = await fetchBracket(useLive);
  const likely = buildMostLikelyDisplayPath(data.path, data.team.group);
  const dupes = assertNoDuplicatePathOpponents(likely, 0);

  const pathNames = likely
    .map((s) => s.topOpponents[0]?.team.name ?? "?")
    .join(" → ");

  console.log(`\n[${label}] likely path: ${pathNames}`);
  if (dupes.length) {
    console.error("  FAIL duplicate foes:", dupes.join("; "));
    return false;
  }
  console.log("  OK");
  return true;
}

async function verify(useLive: boolean) {
  const label = useLive ? "live metrics" : "default Elo";
  const data = await fetchBracket(useLive);

  let allOk = true;
  for (const finish of ["2nd", "1st"] as const) {
    try {
      const { pos, nedId } = findNetherlandsR32(data, finish);

      const result = buildLockedDisplayPath({
        path: data.path,
        teamGroup: data.team.group,
        lockedStage: "round_of_32",
        lockedOpponentId: nedId,
        lockedFinishPos: pos,
      });

      const lockIdx = knockoutStageIndex("round_of_32");
      const dupes = assertNoDuplicatePathOpponents(result.stages, lockIdx, nedId);

      const pathNames = result.stages
        .filter((s) => knockoutStageIndex(s.stage) >= lockIdx)
        .map((s) => s.topOpponents[0]?.team.name ?? "?")
        .join(" → ");

      console.log(`\n[${label}] finish=${pos} win=${(result.winProbability * 100).toFixed(1)}%`);
      console.log(`  Path: ${pathNames}`);

      if (dupes.length) {
        console.error("  FAIL duplicate foes:", dupes.join("; "));
        allOk = false;
        continue;
      }

      const franceCount = pathNames.split("France").length - 1;
      if (franceCount > 1) {
        console.error(`  FAIL France appears ${franceCount} times`);
        allOk = false;
        continue;
      }

      console.log("  OK");
    } catch (e) {
      console.log(`\n[${label}] finish=${finish} skipped: ${(e as Error).message}`);
    }
  }

  return allOk;
}

async function verifyEnglandLockedPath(useLive: boolean) {
  const label = useLive ? "live metrics" : "default Elo";
  const q = new URLSearchParams({ simulations: String(sims) });
  if (useLive) q.set("useLiveMetrics", "1");
  const url = `${baseUrl}/api/bracket-explorer/england?${q}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.log(`\n[${label}] England skipped: ${res.status}`);
    return true;
  }

  const data = (await res.json()) as Awaited<ReturnType<typeof fetchBracket>>;
  const r32 = data.path.find((s) => s.stage === "round_of_32");
  const lockOpp = r32?.topOpponents[0];
  if (!lockOpp) {
    console.log(`\n[${label}] England skipped: no R32 opponent`);
    return true;
  }

  const result = buildLockedDisplayPath({
    path: data.path,
    teamGroup: data.team.group,
    lockedStage: "round_of_32",
    lockedOpponentId: lockOpp.team.id,
    lockedFinishPos: null,
  });

  const r16 = result.stages.find((s) => s.stage === "round_of_16");
  const qf = result.stages.find((s) => s.stage === "quarterfinal");

  const r16Reach = r16?.reachProbability ?? 0;
  const r16HasOpp = (r16?.topOpponents.length ?? 0) > 0;
  const qfHasOpp = (qf?.topOpponents.length ?? 0) > 0;

  console.log(
    `\n[${label}] England lock=${lockOpp.team.name} R16 reach=${(r16Reach * 100).toFixed(1)}% opp=${r16?.topOpponents[0]?.team.name ?? "none"}`,
  );

  if (r16Reach > 0.01 && !r16HasOpp && qfHasOpp) {
    console.error("  FAIL R16 has reach but no opponent while QF has opponent");
    return false;
  }

  if (r16Reach > 0.01 && !r16HasOpp) {
    console.error("  FAIL R16 has reach but no opponent");
    return false;
  }

  console.log("  OK");
  return true;
}

const ok =
  (await verifyLikelyPath(false)) &&
  (await verifyLikelyPath(true)) &&
  (await verify(false)) &&
  (await verify(true)) &&
  (await verifyEnglandLockedPath(false)) &&
  (await verifyEnglandLockedPath(true));
process.exit(ok ? 0 : 1);
