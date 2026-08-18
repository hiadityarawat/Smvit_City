export const DISTRICTS = [
  "DEVELOPER",
  "CREATOR",
  "GAMING",
  "MUSIC",
  "SPORTS",
  "TRENDING",
  "NEWCOMER",
] as const;

export type District = (typeof DISTRICTS)[number];
export type GraphicsPreset = "LOW" | "MEDIUM" | "HIGH";

export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export interface HealthStatus {
  status: "ok" | "degraded";
  service: "socialverse-api";
  version: string;
  timestamp: string;
}

export interface PlayerTransform {
  x: number;
  y: number;
  z: number;
  rotationY: number;
  movement: "idle" | "walk" | "run" | "jump";
  sequence: number;
}

export type UserRole = "USER" | "MODERATOR" | "ADMIN";

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  district: District;
  role: UserRole;
  buildingId: string;
  createdAt: string;
}

export interface AuthSession {
  accessToken: string;
  expiresInSeconds: number;
  user: SessionUser;
}

export interface RegisterInput {
  email: string;
  username: string;
  displayName: string;
  password: string;
}

export interface LoginInput {
  emailOrUsername: string;
  password: string;
}
