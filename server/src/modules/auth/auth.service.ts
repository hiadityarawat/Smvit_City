import { randomUUID } from "node:crypto";
import { AccountStatus, BuildingStyle, District, Prisma, type User } from "@prisma/client";
import type { AuthSession, SessionUser } from "@socialverse/shared";
import { env } from "../../config/env.js";
import { prisma } from "../../database/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { randomBuildingLot } from "./building-allocation.js";
import type { LoginPayload, RegisterPayload } from "./auth.schemas.js";
import { hashPassword, verifyPassword } from "./password.js";
import { passwordResetDelivery } from "./reset-delivery.js";
import {
  ACCESS_TOKEN_SECONDS, createAccessToken, createOpaqueToken, hashOpaqueToken, newTokenFamily, refreshExpiry,
} from "./tokens.js";

const sessionInclude = { profile: true, building: true } satisfies Prisma.UserInclude;
type SessionRecord = Prisma.UserGetPayload<{ include: typeof sessionInclude }>;

function sessionUser(user: SessionRecord): SessionUser {
  if (!user.profile || !user.building) throw new AppError(500, "ACCOUNT_INCOMPLETE", "The account could not be loaded.");
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.profile.displayName,
    avatarUrl: user.profile.avatarUrl,
    district: user.profile.district,
    role: user.role,
    buildingId: user.building.id,
    createdAt: user.createdAt.toISOString(),
  };
}

function createSessionResponse(user: SessionRecord): Omit<AuthSession, "accessToken"> & { accessToken: string } {
  return { accessToken: createAccessToken(user), expiresInSeconds: ACCESS_TOKEN_SECONDS, user: sessionUser(user) };
}

function assertActive(user: Pick<User, "status">) {
  if (user.status !== AccountStatus.ACTIVE) throw new AppError(403, "ACCOUNT_UNAVAILABLE", "This account is not available.");
}

export const authService = {
  async register(input: RegisterPayload) {
    const passwordHash = await hashPassword(input.password);
    const rawRefreshToken = createOpaqueToken();
    const refreshTokenHash = hashOpaqueToken(rawRefreshToken);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const lot = randomBuildingLot();
      try {
        const user = await prisma.user.create({
          data: {
            email: input.email,
            username: input.username,
            passwordHash,
            profile: { create: { displayName: input.displayName, district: District.NEWCOMER } },
            privacy: { create: {} },
            building: {
              create: {
                ...lot, district: District.NEWCOMER, style: BuildingStyle.HOUSE,
                customization: { create: {} },
              },
            },
            refreshTokens: {
              create: { tokenHash: refreshTokenHash, familyId: newTokenFamily(), expiresAt: refreshExpiry() },
            },
          },
          include: sessionInclude,
        });
        return { session: createSessionResponse(user), refreshToken: rawRefreshToken };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          const target = String(error.meta?.target ?? "");
          if (target.includes("x") && target.includes("z") && attempt < 2) continue;
          throw new AppError(409, "ACCOUNT_ALREADY_EXISTS", "That email or username is already registered.");
        }
        throw error;
      }
    }
    throw new AppError(503, "BUILDING_ALLOCATION_FAILED", "A city lot could not be allocated. Please try again.");
  },

  async login(input: LoginPayload) {
    const user = await prisma.user.findFirst({
      where: input.emailOrUsername.includes("@") ? { email: input.emailOrUsername } : { username: input.emailOrUsername },
      include: sessionInclude,
    });
    if (!user || !(await verifyPassword(user.passwordHash, input.password))) {
      throw new AppError(401, "INVALID_CREDENTIALS", "The email, username, or password is incorrect.");
    }
    assertActive(user);
    const rawRefreshToken = createOpaqueToken();
    await prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: hashOpaqueToken(rawRefreshToken), familyId: newTokenFamily(), expiresAt: refreshExpiry() },
    });
    await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
    return { session: createSessionResponse(user), refreshToken: rawRefreshToken };
  },

  async refresh(rawToken: string) {
    const token = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashOpaqueToken(rawToken) }, include: { user: { include: sessionInclude } },
    });
    if (!token) throw new AppError(401, "INVALID_REFRESH_TOKEN", "Your session is invalid. Please sign in again.");
    if (token.revokedAt) {
      await prisma.refreshToken.updateMany({ where: { familyId: token.familyId, revokedAt: null }, data: { revokedAt: new Date() } });
      throw new AppError(401, "SESSION_REUSE_DETECTED", "Your session was revoked for security. Please sign in again.");
    }
    if (token.expiresAt <= new Date()) throw new AppError(401, "REFRESH_TOKEN_EXPIRED", "Your session has expired. Please sign in again.");
    assertActive(token.user);

    const replacementRaw = createOpaqueToken();
    const replacementId = randomUUID();
    const rotated = await prisma.$transaction(async (transaction) => {
      const consumed = await transaction.refreshToken.updateMany({
        where: { id: token.id, revokedAt: null }, data: { revokedAt: new Date(), replacedBy: replacementId },
      });
      if (consumed.count !== 1) throw new AppError(401, "SESSION_REUSE_DETECTED", "Your session was already used. Please sign in again.");
      await transaction.refreshToken.create({
        data: {
          id: replacementId, userId: token.userId, tokenHash: hashOpaqueToken(replacementRaw), familyId: token.familyId,
          expiresAt: refreshExpiry(),
        },
      });
      return createSessionResponse(token.user);
    });
    return { session: rotated, refreshToken: replacementRaw };
  },

  async logout(rawToken?: string) {
    if (!rawToken) return;
    await prisma.refreshToken.updateMany({ where: { tokenHash: hashOpaqueToken(rawToken), revokedAt: null }, data: { revokedAt: new Date() } });
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: sessionInclude });
    if (!user) throw new AppError(404, "USER_NOT_FOUND", "The account no longer exists.");
    assertActive(user);
    return sessionUser(user);
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, status: true } });
    if (!user || user.status !== AccountStatus.ACTIVE) return;
    const rawToken = createOpaqueToken();
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
      prisma.passwordResetToken.create({
        data: {
          userId: user.id, tokenHash: hashOpaqueToken(rawToken),
          expiresAt: new Date(Date.now() + env.PASSWORD_RESET_TTL_MINUTES * 60_000),
        },
      }),
    ]);
    await passwordResetDelivery.send({ email: user.email, token: rawToken });
  },

  async resetPassword(rawToken: string, password: string) {
    const token = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashOpaqueToken(rawToken) } });
    if (!token || token.usedAt || token.expiresAt <= new Date()) {
      throw new AppError(400, "INVALID_RESET_TOKEN", "This password reset link is invalid or has expired.");
    }
    const passwordHash = await hashPassword(password);
    await prisma.$transaction(async (transaction) => {
      const consumed = await transaction.passwordResetToken.updateMany({
        where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() },
      });
      if (consumed.count !== 1) throw new AppError(400, "INVALID_RESET_TOKEN", "This password reset link has already been used.");
      await transaction.user.update({ where: { id: token.userId }, data: { passwordHash } });
      await transaction.refreshToken.updateMany({ where: { userId: token.userId, revokedAt: null }, data: { revokedAt: new Date() } });
    });
  },
};
