import { Router } from "express";
import { TEAMS, TEAMS_BY_ID } from "../data/teams";

const router = Router();

router.get("/teams", (_req, res) => {
  res.json(TEAMS);
});

router.get("/teams/:id", (req, res) => {
  const team = TEAMS_BY_ID[req.params.id];
  if (!team) {
    res.status(404).json({ error: `Team not found: ${req.params.id}` });
    return;
  }
  res.json(team);
});

export default router;
