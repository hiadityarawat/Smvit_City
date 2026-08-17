import { Router } from "express";
import type { ApiEnvelope, HealthStatus } from "@socialverse/shared";
import { prisma } from "../database/prisma.js";

export const healthRouter = Router();

healthRouter.get("/health", (_request, response) => {
  const data: HealthStatus = { status: "ok", service: "socialverse-api", version: "0.1.0", timestamp: new Date().toISOString() };
  const body: ApiEnvelope<HealthStatus> = { data };
  response.json(body);
});

healthRouter.get("/ready", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.json({ data: { status: "ready", database: "connected" } });
  } catch {
    response.status(503).json({ error: { code: "DATABASE_UNAVAILABLE", message: "Database is not ready." } });
  }
});
