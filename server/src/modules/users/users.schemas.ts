import { District } from "@prisma/client";
import { z } from "zod";

export const usernameParamSchema = z.object({ username: z.string().trim().toLowerCase().min(3).max(32) });
export const userIdParamSchema = z.object({ id: z.uuid() });

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  bio: z.string().trim().max(500).optional(),
  avatarUrl: z.url().max(2048).nullable().optional(),
  interests: z.array(z.string().trim().min(1).max(32)).max(12).transform((values) => [...new Set(values.map((value) => value.toLowerCase()))]).optional(),
  district: z.enum(District).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required.");

export const updatePrivacySchema = z.object({
  showOnlineStatus: z.boolean().optional(), showLastSeen: z.boolean().optional(), allowBuildingVisits: z.boolean().optional(),
  showFollowerInformation: z.boolean().optional(), allowFriendRequests: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required.");

export const searchSchema = z.object({
  q: z.string().trim().max(80).default(""),
  district: z.enum(District).optional(),
  interest: z.string().trim().toLowerCase().max(32).optional(),
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
