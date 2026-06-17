import { Router } from "express";
import { fetchLatestFixtures, fetchLatestFootballLive } from "../services/football-live";

const router = Router();
const LIVE_TIMEOUT_MS = 25_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

function noStore(res: { setHeader: (k: string, v: string) => void }) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
}

/** Fixtures, standings, and teams from worldcup26.ir in one request. */
router.get("/football/live", async (_req, res) => {
  noStore(res);
  try {
    const payload = await withTimeout(fetchLatestFootballLive(), LIVE_TIMEOUT_MS, "football/live");
    res.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch live football data";
    res.status(502).json({ error: message });
  }
});

/** Fixtures only — backward compatible. */
router.get("/football/fixtures", async (_req, res) => {
  noStore(res);
  try {
    const fixtures = await withTimeout(fetchLatestFixtures(), LIVE_TIMEOUT_MS, "football/fixtures");
    res.json({ fixtures, fetchedAt: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch fixtures";
    res.status(502).json({ error: message });
  }
});

export default router;
