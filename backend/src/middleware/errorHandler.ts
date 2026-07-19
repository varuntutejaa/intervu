import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/httpError.js";
import { logger } from "../lib/logger.js";

// The one place an error becomes an HTTP response — every route's errors
// (thrown HttpErrors, Zod validation failures, or anything unexpected) funnel
// here via asyncHandler, so the shape of an error response never depends on
// which route handler happened to catch it.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    const message = err.issues[0]?.message ?? "Invalid request.";
    res.status(400).json({ success: false, error: message });
    return;
  }

  if (err instanceof HttpError) {
    if (err.status >= 500) logger.error({ err, path: req.path }, err.message);
    res.status(err.status).json({ success: false, error: err.message });
    return;
  }

  logger.error({ err, path: req.path }, "Unhandled error");
  res.status(500).json({ success: false, error: "Internal server error" });
}
