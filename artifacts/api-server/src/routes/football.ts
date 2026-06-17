import { Router } from "express";
import { fetchLatestFixtures } from "../services/football-fixtures";

const router = Router();

/** Live fixtures from worldcup26.ir — fresher than Supabase cron cache. */
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
