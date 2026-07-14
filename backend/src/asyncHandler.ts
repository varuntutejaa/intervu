import type { RequestHandler } from "express";

// Forwards rejected promises from async route handlers to Express's error
// handler instead of letting them crash the process as unhandled rejections.
export const asyncHandler =
  (handler: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
