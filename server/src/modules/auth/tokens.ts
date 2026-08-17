import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import type { UserRole } from "@prisma/client";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import type { AccessClaims } from "./auth.types.js";

export const ACCESS_TOKEN_SECONDS = parseDurationSeconds(env.ACCESS_TOKEN_TTL);

export function createAccessToken(user: { id: string; username: string; role: UserRole }) {
  const claims: AccessClaims = { sub: user.id, username: user.username, role: user.role, type: "access" };
  return jwt.sign(claims, env.ACCESS_TOKEN_SECRET, {
    algorithm: "HS256",
    expiresIn: ACCESS_TOKEN_SECONDS,
    issuer: "socialverse-api",
    audience: "socialverse-client",
  });
}

export function verifyAccessToken(token: string): AccessClaims {
  try {
    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET, {
      algorithms: ["HS256"], issuer: "socialverse-api", audience: "socialverse-client",
    });
    if (typeof payload === "string" || payload.type !== "access" || typeof payload.sub !== "string") throw new Error("Invalid claims");
    return payload as unknown as AccessClaims;
  } catch {
    throw new AppError(401, "INVALID_ACCESS_TOKEN", "Your session is invalid or has expired.");
  }
}

export function createOpaqueToken() {
  return randomBytes(48).toString("base64url");
}

export function hashOpaqueToken(token: string) {
  return createHash("sha256").update(`${token}.${env.REFRESH_TOKEN_SECRET}`).digest("hex");
}

export function newTokenFamily() {
  return randomUUID();
}

export function refreshExpiry() {
  return new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000);
}

function parseDurationSeconds(value: string) {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) return 900;
  const amount = Number(match[1]);
  const multipliers = { s: 1, m: 60, h: 3_600, d: 86_400 } as const;
  return amount * multipliers[match[2] as keyof typeof multipliers];
}
