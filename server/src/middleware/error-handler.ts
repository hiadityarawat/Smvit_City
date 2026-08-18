import type { ErrorRequestHandler, RequestHandler } from "express";
import { logger } from "../config/logger.js";
import { AppError } from "../utils/app-error.js";

export const notFound: RequestHandler = (request, _response, next) => {
  next(new AppError(404, "ROUTE_NOT_FOUND", `No route matches ${request.method} ${request.path}`));
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ error: { code: error.code, message: error.message, details: error.details } });
    return;
  }

  logger.error({ err: error }, "Unhandled request error");
  response.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong." } });
};
