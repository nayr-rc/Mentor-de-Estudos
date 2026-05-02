import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sessionsRouter from "./sessions";
import habitsRouter from "./habits";
import questionsRouter from "./questions";
import goalsRouter from "./goals";
import dashboardRouter from "./dashboard";
import mentorRouter from "./mentor";
import userRouter from "./user";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sessionsRouter);
router.use(habitsRouter);
router.use(questionsRouter);
router.use(goalsRouter);
router.use(dashboardRouter);
router.use(mentorRouter);
router.use(userRouter);

export default router;
