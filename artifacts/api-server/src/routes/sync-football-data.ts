import { Router } from "express";
import { SYNC_JOBS, type SyncJobName } from "@workspace/football-config";
import { runAllSyncJobs, runSyncJob } from "../services/football-sync";

const router = Router();

function isAuthorized(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  if (req.headers["x-vercel-cron"] === "1") return true;
  const auth = req.headers.authorization;
  if (!auth || typeof auth !== "string") return false;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

router.get("/sync-football-data", async (req, res) => {
  if (!isAuthorized(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const force = req.query.force === "1" || req.query.force === "true";
  const jobParam = typeof req.query.job === "string" ? req.query.job : "all";

  try {
    if (jobParam === "all") {
      const results = await runAllSyncJobs(force);
      res.json({ ok: true, results });
      return;
    }

    if (!SYNC_JOBS.includes(jobParam as SyncJobName)) {
      res.status(400).json({ error: `Invalid job. Use: ${SYNC_JOBS.join(", ")}, all` });
      return;
    }

    const result = await runSyncJob(jobParam as SyncJobName, force);
    res.json({ ok: true, results: [result] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    res.status(500).json({ ok: false, error: message });
  }
});

export default router;
