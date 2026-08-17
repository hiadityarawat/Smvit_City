import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../utils/app-error.js";

export function validateBody(schema: ZodType): RequestHandler {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      next(new AppError(400, "VALIDATION_ERROR", "The submitted information is invalid.", result.error.flatten()));
      return;
    }
    request.body = result.data;
    next();
  };
}
