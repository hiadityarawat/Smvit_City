import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../utils/app-error.js";

export function validatePart(part: "params" | "query", schema: ZodType): RequestHandler {
  return (request, _response, next) => {
    const result = schema.safeParse(request[part]);
    if (!result.success) { next(new AppError(400, "VALIDATION_ERROR", "The request is invalid.", result.error.flatten())); return; }
    Object.defineProperty(request, part, { value: result.data, writable: true, configurable: true });
    next();
  };
}
