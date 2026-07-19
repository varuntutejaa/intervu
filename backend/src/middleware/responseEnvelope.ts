import type { NextFunction, Request, Response } from "express";

// Wraps every successful response in a consistent { success: true, data }
// shape by patching res.json once per request, so no individual controller
// has to remember to do it — they keep calling res.json(payload) exactly as
// before. errorHandler builds its own { success: false, error } shape
// directly (the "success" in body check below lets that pass through
// unwrapped instead of getting double-enveloped).
export function responseEnvelope(_req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    if (body && typeof body === "object" && "success" in body) {
      return originalJson(body);
    }
    return originalJson({ success: true, data: body });
  }) as Response["json"];
  next();
}
