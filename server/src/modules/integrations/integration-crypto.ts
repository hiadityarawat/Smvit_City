import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";

const encryptionKey = createHash("sha256").update(env.INTEGRATION_TOKEN_SECRET).digest();

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptSecret(value: string) {
  const [iv, tag, encrypted] = value.split(".").map((part) => Buffer.from(part, "base64url"));
  if (!iv || !tag || !encrypted) throw new AppError(500, "INVALID_TOKEN_CIPHER", "A connected account token could not be read.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

interface OAuthState { userId: string; provider: string; expiresAt: number; nonce: string }

export function createOAuthState(userId: string, provider: string) {
  const payload = Buffer.from(JSON.stringify({ userId, provider, expiresAt: Date.now() + 10 * 60_000, nonce: randomBytes(16).toString("hex") } satisfies OAuthState)).toString("base64url");
  const signature = createHmac("sha256", env.OAUTH_STATE_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyOAuthState(value: string): OAuthState {
  const [payload, suppliedSignature] = value.split(".");
  if (!payload || !suppliedSignature) throw new AppError(400, "INVALID_OAUTH_STATE", "The account connection request is invalid or expired.");
  const expected = createHmac("sha256", env.OAUTH_STATE_SECRET).update(payload).digest();
  const supplied = Buffer.from(suppliedSignature, "base64url");
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) throw new AppError(400, "INVALID_OAUTH_STATE", "The account connection request is invalid or expired.");
  const state = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as OAuthState;
  if (!state.userId || !state.provider || state.expiresAt < Date.now()) throw new AppError(400, "INVALID_OAUTH_STATE", "The account connection request is invalid or expired.");
  return state;
}
