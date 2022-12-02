import { Router } from "express";
import songbookRouter from "./songbook";

const apiRouter = Router();

apiRouter.get("/test", (req, res) => res.send("hi"));

apiRouter.use("/songbook", songbookRouter);

export default apiRouter;

