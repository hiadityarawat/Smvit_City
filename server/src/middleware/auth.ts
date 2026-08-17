import type { RequestHandler } from "express";
import type { UserRole } from "@prisma/client";
import { verifyAccessToken } from "../modules/auth/tokens.js";
import { AppError } from "../utils/app-error.js";

export const requireAuth: RequestHandler = (request, _response, next) => {
  const header = request.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    next(new AppError(401, "AUTHENTICATION_REQUIRED", "Please sign in to continue."));
    return;
  }
  request.auth = verifyAccessToken(header.slice(7));
  next();
};

export const optionalAuth: RequestHandler = (request, _response, next) => {
  const header = request.get("authorization");
  if (!header?.startsWith("Bearer ")) { next(); return; }
  try { request.auth = verifyAccessToken(header.slice(7)); } catch { /* Public projection remains anonymous. */ }
  next();
};

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.auth || !roles.includes(request.auth.role)) {
      next(new AppError(403, "INSUFFICIENT_PERMISSIONS", "You do not have permission to perform this action."));
      return;
    }
    next();
  };
}
