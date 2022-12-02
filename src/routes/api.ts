import { Router } from "express";

const apiRouter = Router();

apiRouter.get("/test", (req, res) => res.send("hi"));

export default apiRouter;
