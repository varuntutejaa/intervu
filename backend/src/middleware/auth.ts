import type { Request, Response } from "express";
import { signAppToken, verifyAppToken, type AppTokenPayload } from "../lib/jwt.js";

const COOKIE_NAME = "token";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// The one place that reads this app's auth cookie and verifies it — every
// route that needs to know "who is this" (requireRole, /me, profile, etc.)
// goes through this instead of touching the cookie/JWT directly.
export function getAuthUser(req: Request): AppTokenPayload | null {
  const token = req.cookies?.[COOKIE_NAME];
  if (typeof token !== "string") return null;
  return verifyAppToken(token);
}

export function setAuthCookie(res: Response, payload: AppTokenPayload): void {
  res.cookie(COOKIE_NAME, signAppToken(payload), COOKIE_OPTIONS);
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: COOKIE_OPTIONS.secure, sameSite: "lax" });
}
