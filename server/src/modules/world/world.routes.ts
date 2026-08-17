import { Router } from "express";
import { optionalAuth, requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { validatePart } from "../../middleware/validate-request.js";
import { buildingParamSchema, chunkSchema, customizationSchema, nearbySchema } from "./world.schemas.js";
import { worldService } from "./world.service.js";

export const worldRouter = Router();
worldRouter.get("/world", async (_req, res) => { res.json({ data: await worldService.state() }); });
worldRouter.get("/world/buildings", optionalAuth, validatePart("query", nearbySchema), async (req, res) => { const query = req.query as never as { x: number; z: number; radius: number; limit: number }; res.json({ data: await worldService.nearby(query.x, query.z, query.radius, query.limit) }); });
worldRouter.get("/world/chunks/:chunkX/:chunkZ", validatePart("params", chunkSchema), async (req, res) => { res.set("Cache-Control", "public, max-age=15, stale-while-revalidate=45").json({ data: await worldService.chunk(Number(req.params.chunkX), Number(req.params.chunkZ)) }); });
worldRouter.get("/buildings/:id", optionalAuth, validatePart("params", buildingParamSchema), async (req, res) => { res.json({ data: await worldService.building(String(req.params.id)) }); });
worldRouter.patch("/buildings/:id", requireAuth, validatePart("params", buildingParamSchema), validateBody(customizationSchema), async (req, res) => { res.json({ data: await worldService.customize(req.auth!.sub, String(req.params.id), req.body) }); });
worldRouter.post("/buildings/:id/visit", requireAuth, validatePart("params", buildingParamSchema), async (req, res) => { res.status(201).json({ data: await worldService.visit(req.auth!.sub, String(req.params.id)) }); });
worldRouter.post("/buildings/:id/favorite", requireAuth, validatePart("params", buildingParamSchema), async (req, res) => { res.status(201).json({ data: await worldService.favorite(req.auth!.sub, String(req.params.id)) }); });
worldRouter.delete("/buildings/:id/favorite", requireAuth, validatePart("params", buildingParamSchema), async (req, res) => { res.json({ data: await worldService.unfavorite(req.auth!.sub, String(req.params.id)) }); });
worldRouter.get("/me/favorites", requireAuth, async (req, res) => { res.json({ data: await worldService.favorites(req.auth!.sub) }); });
