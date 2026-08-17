import { z } from "zod";

const password = z.string()
  .min(10, "Password must contain at least 10 characters.")
  .max(128, "Password must not exceed 128 characters.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/\d/, "Password must include a number.");

export const registerSchema = z.object({
  email: z.email().max(320).transform((value) => value.trim().toLowerCase()),
  username: z.string().trim().toLowerCase().min(3).max(32).regex(/^[a-z0-9_]+$/, "Use letters, numbers, and underscores only."),
  displayName: z.string().trim().min(1).max(80),
  password,
}).strict();

export const loginSchema = z.object({
  emailOrUsername: z.string().trim().toLowerCase().min(3).max(320),
  password: z.string().min(1).max(128),
}).strict();

export const forgotPasswordSchema = z.object({
  email: z.email().max(320).transform((value) => value.trim().toLowerCase()),
}).strict();

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(256),
  password,
}).strict();

export type RegisterPayload = z.infer<typeof registerSchema>;
export type LoginPayload = z.infer<typeof loginSchema>;
