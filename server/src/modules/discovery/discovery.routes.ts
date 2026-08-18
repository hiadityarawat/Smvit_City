import { Router } from "express";
import { discoveryService } from "./discovery.service.js";
export const discoveryRouter = Router();
discoveryRouter.get("/trending", async (_req, res) => { res.json({ data: await discoveryService.trending() }); });
discoveryRouter.get("/leaderboard", async (req, res) => { const metric = typeof req.query.metric === "string" ? req.query.metric : "followers"; res.json({ data: await discoveryService.leaderboard(metric) }); });
