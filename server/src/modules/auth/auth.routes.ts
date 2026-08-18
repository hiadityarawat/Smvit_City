import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { forgotPassword, login, logout, me, refresh, register, resetPassword } from "./auth.controller.js";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "./auth.schemas.js";

export const authRouter = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false });

authRouter.post("/register", authLimiter, validateBody(registerSchema), register);
authRouter.post("/login", authLimiter, validateBody(loginSchema), login);
authRouter.post("/refresh", authLimiter, refresh);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);
authRouter.post("/forgot-password", authLimiter, validateBody(forgotPasswordSchema), forgotPassword);
authRouter.post("/reset-password", authLimiter, validateBody(resetPasswordSchema), resetPassword);
