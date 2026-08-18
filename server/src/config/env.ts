import "dotenv/config";
import { z } from "zod";

const optionalString = z.preprocess((value) => value === "" ? undefined : value, z.string().optional());
const optionalEmail = z.preprocess((value) => value === "" ? undefined : value, z.string().email().optional());

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SERVER_PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1).default("postgresql://socialverse:socialverse_dev@localhost:5432/socialverse?schema=public"),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  ACCESS_TOKEN_SECRET: z.string().min(32).default("development-access-secret-change-me-now"),
  REFRESH_TOKEN_SECRET: z.string().min(32).default("development-refresh-secret-change-me-now"),
  ACCESS_TOKEN_TTL: z.string().regex(/^\d+[smhd]$/).default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().min(5).max(120).default(30),
  PASSWORD_RESET_URL: z.string().url().default("http://localhost:5173/reset-password"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  COOKIE_SECURE: z.string().default("false").transform((value) => value === "true"),
  API_PUBLIC_URL: z.string().url().default("http://localhost:4000"),
  OAUTH_STATE_SECRET: z.string().min(32).default("development-oauth-state-secret-change-me"),
  INTEGRATION_TOKEN_SECRET: z.string().min(32).default("development-integration-token-secret"),
  GITHUB_CLIENT_ID: optionalString,
  GITHUB_CLIENT_SECRET: optionalString,
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  TWITCH_CLIENT_ID: optionalString,
  TWITCH_CLIENT_SECRET: optionalString,
  SPOTIFY_CLIENT_ID: optionalString,
  SPOTIFY_CLIENT_SECRET: optionalString,
  RESEND_API_KEY: optionalString,
  EMAIL_FROM: optionalEmail,
});

const result = schema.safeParse(process.env);
if (!result.success) {
  throw new Error(`Invalid environment configuration: ${z.prettifyError(result.error)}`);
}

export const env = result.data;
