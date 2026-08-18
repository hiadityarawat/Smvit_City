import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { requireAuth } from "../../middleware/auth.js";
import { validatePart } from "../../middleware/validate-request.js";
import { integrationsService } from "./integrations.service.js";

const providerParam = z.object({ provider: z.enum(["github", "youtube", "twitch", "spotify"]) });
const callbackQuery = z.object({ code: z.string().min(1), state: z.string().min(20) });
export const integrationsRouter = Router();

integrationsRouter.get("/", requireAuth, async (request, response) => response.json({ data: await integrationsService.list(request.auth!.sub) }));
integrationsRouter.post("/:provider/connect", requireAuth, validatePart("params", providerParam), async (request, response) => response.json({ data: integrationsService.connect(request.auth!.sub, String(request.params.provider)) }));
integrationsRouter.get("/:provider/callback", validatePart("params", providerParam), validatePart("query", callbackQuery), async (request, response, next) => {
  try {
    const label = await integrationsService.callback(String(request.params.provider), String(request.query.code), String(request.query.state));
    response.redirect(`${env.CLIENT_ORIGIN}/settings?integration=connected&provider=${encodeURIComponent(label)}`);
  } catch (error) { next(error); }
});
integrationsRouter.delete("/:provider", requireAuth, validatePart("params", providerParam), async (request, response) => { await integrationsService.disconnect(request.auth!.sub, String(request.params.provider)); response.status(204).end(); });
