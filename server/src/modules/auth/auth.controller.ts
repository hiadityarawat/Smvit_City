import type { CookieOptions, RequestHandler } from "express";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import type { LoginPayload, RegisterPayload } from "./auth.schemas.js";
import { authService } from "./auth.service.js";

export const REFRESH_COOKIE = "sv_refresh";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: "lax",
  path: "/api/auth",
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86_400_000,
};

function requestRefreshToken(request: Parameters<RequestHandler>[0]) {
  const value: unknown = request.cookies?.[REFRESH_COOKIE];
  return typeof value === "string" ? value : undefined;
}

export const register: RequestHandler = async (request, response) => {
  const result = await authService.register(request.body as RegisterPayload);
  response.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions).status(201).json({ data: result.session });
};

export const login: RequestHandler = async (request, response) => {
  const result = await authService.login(request.body as LoginPayload);
  response.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions).json({ data: result.session });
};

export const refresh: RequestHandler = async (request, response) => {
  const token = requestRefreshToken(request);
  if (!token) throw new AppError(401, "REFRESH_TOKEN_REQUIRED", "No refresh session was found.");
  const result = await authService.refresh(token);
  response.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions).json({ data: result.session });
};

export const logout: RequestHandler = async (request, response) => {
  await authService.logout(requestRefreshToken(request));
  response.clearCookie(REFRESH_COOKIE, cookieOptions).status(204).send();
};

export const me: RequestHandler = async (request, response) => {
  response.json({ data: await authService.me(request.auth!.sub) });
};

export const forgotPassword: RequestHandler = async (request, response) => {
  await authService.forgotPassword((request.body as { email: string }).email);
  response.status(202).json({ data: { message: "If that account exists, password reset instructions have been prepared." } });
};

export const resetPassword: RequestHandler = async (request, response) => {
  const body = request.body as { token: string; password: string };
  await authService.resetPassword(body.token, body.password);
  response.json({ data: { message: "Your password has been reset. Please sign in." } });
};
