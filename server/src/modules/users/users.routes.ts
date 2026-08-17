import { Router } from "express";
import { optionalAuth, requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { validatePart } from "../../middleware/validate-request.js";
import { searchSchema, updatePrivacySchema, updateProfileSchema, usernameParamSchema } from "./users.schemas.js";
import { usersService } from "./users.service.js";

export const usersRouter = Router();

usersRouter.get("/search", optionalAuth, validatePart("query", searchSchema), async (request, response) => {
  const result = await usersService.search(request.query as never); response.json({ data: result.items, meta: { nextCursor: result.nextCursor } });
});
usersRouter.get("/:username", optionalAuth, validatePart("params", usernameParamSchema), async (request, response) => {
  response.json({ data: await usersService.profile(String(request.params.username), request.auth?.sub) });
});
usersRouter.patch("/me/profile", requireAuth, validateBody(updateProfileSchema), async (request, response) => {
  response.json({ data: await usersService.updateProfile(request.auth!.sub, request.body) });
});
usersRouter.patch("/me/privacy", requireAuth, validateBody(updatePrivacySchema), async (request, response) => {
  response.json({ data: await usersService.updatePrivacy(request.auth!.sub, request.body) });
});
