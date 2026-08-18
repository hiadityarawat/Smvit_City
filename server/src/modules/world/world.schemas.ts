import { z } from "zod";

export const nearbySchema = z.object({
  x: z.coerce.number().finite(), z: z.coerce.number().finite(), radius: z.coerce.number().min(32).max(1000).default(384), limit: z.coerce.number().int().min(1).max(500).default(250),
});
export const chunkSchema = z.object({ chunkX: z.coerce.number().int().min(-10000).max(10000), chunkZ: z.coerce.number().int().min(-10000).max(10000) });
export const buildingParamSchema = z.object({ id: z.uuid() });
export const customizationSchema = z.object({
  theme: z.enum(["MIDNIGHT", "AURORA", "SUNSET", "FOREST", "OCEAN", "NEON"]).optional(),
  facadeAsset: z.enum(["facade-01", "facade-02", "facade-03"]).optional(), windowAsset: z.enum(["window-01", "window-02", "window-03"]).optional(),
  signAsset: z.enum(["sign-01", "sign-02", "sign-03"]).optional(), roofAsset: z.enum(["roof-01", "roof-02", "roof-03"]).optional(),
  billboardText: z.string().trim().max(80).nullable().optional(), billboardImageUrl: z.url().max(2048).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one customization is required.");
