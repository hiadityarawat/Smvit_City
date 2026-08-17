import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./database/prisma.js";
import { createSocketServer } from "./socket/index.js";

const httpServer = createServer(createApp());
createSocketServer(httpServer);

httpServer.listen(env.SERVER_PORT, "0.0.0.0", () => logger.info({ port: env.SERVER_PORT }, "SocialVerse API listening"));

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down");
  httpServer.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
