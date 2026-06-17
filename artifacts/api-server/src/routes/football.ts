import { Router } from "express";
import { fetchLatestFixtures, fetchLatestFootballLive } from "../services/football-live";
import { fetchFootballLiveFromSupabase } from "../services/football-supabase-live";

const router = Router();
const LIVE_TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

function liveCacheHeaders(res: { setHeader: (k: string, v: string) => void }) {
  res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Failed to fetch live football data";
}

/** Fixtures, standings, and teams — Supabase sync cache (worldcup26 refreshed by cron). */
router.get("/football/live", async (_req, res) => {
  liveCacheHeaders(res);
  try {
    let cached: Awaited<ReturnType<typeof fetchFootballLiveFromSupabase>> = null;
    try {
      cached = await fetchFootballLiveFromSupabase();
    } catch (cacheErr) {
      console.warn("football/live supabase cache failed:", errorMessage(cacheErr));
    }

    // Optional live upgrade (often unreachable from Vercel — never block on it)
    let live: Awaited<ReturnType<typeof fetchLatestFootballLive>> | null = null;
    try {
      live = await withTimeout(fetchLatestFootballLive(), 4_000, "football/live");
    } catch {
      /* use cache */
    }

    if (live) {
      res.json({ ...live, source: "api" as const, liveApiError: null });
      return;
    }

    if (cached) {
      res.json({ ...cached, source: "supabase" as const, liveApiError: null });
      return;
    }

    res.status(503).json({ error: "Football data cache unavailable" });
  } catch (err) {
    res.status(502).json({ error: errorMessage(err) });
  }
});

/** Fixtures only — backward compatible. */
router.get("/football/fixtures", async (_req, res) => {
  liveCacheHeaders(res);
  try {
    const fixtures = await withTimeout(fetchLatestFixtures(), LIVE_TIMEOUT_MS, "football/fixtures");
    res.json({ fixtures, fetchedAt: new Date().toISOString(), source: "api" });
  } catch (err) {
    const message = errorMessage(err);
    res.status(502).json({ error: message });
  }
});

export default router;
