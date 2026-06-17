import { Router } from "express";
import { fetchLatestFixtures, fetchLatestFootballLive } from "../services/football-live";

const router = Router();

/** Fixtures, standings, and teams from worldcup26.ir in one request. */
router.get("/football/live", async (_req, res) => {
  try {
    const payload = await fetchLatestFootballLive();
    res.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch live football data";
    res.status(502).json({ error: message });
  }
});

/** Fixtures only — backward compatible. */
router.get("/football/fixtures", async (_req, res) => {
  try {
    const fixtures = await fetchLatestFixtures();
    res.json({ fixtures, fetchedAt: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch fixtures";
    res.status(502).json({ error: message });
  }
});

export default router;
