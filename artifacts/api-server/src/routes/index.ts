import { Router, type IRouter } from "express";
import healthRouter from "./health";
import teamsRouter from "./teams";
import probabilityRouter from "./probability";

const router: IRouter = Router();

router.use(healthRouter);
router.use(teamsRouter);
router.use(probabilityRouter);

export default router;
