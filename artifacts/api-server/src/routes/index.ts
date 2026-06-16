import { Router, type IRouter } from "express";
import healthRouter from "./health";
import teamsRouter from "./teams";
import probabilityRouter from "./probability";
import syncFootballDataRouter from "./sync-football-data";

const router: IRouter = Router();

router.use(healthRouter);
router.use(teamsRouter);
router.use(probabilityRouter);
router.use(syncFootballDataRouter);

export default router;
