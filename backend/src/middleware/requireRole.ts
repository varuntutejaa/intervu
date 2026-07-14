import type { Request, Response } from "express";
import { pool } from "./db.js";

// Looks up the caller's role from `profiles` (the session only carries
// identity, not role) and 401s/403s directly on the response when it
// doesn't match, so callers can just check for a null return.
export async function requireRole(
  req: Request,
  res: Response,
  role: "candidate" | "recruiter",
): Promise<{ sub: string; email: string } | null> {
  if (!req.session.user) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }

  const result = await pool.query("SELECT role FROM profiles WHERE auth_sub = $1", [
    req.session.user.sub,
  ]);
  if (result.rows[0]?.role !== role) {
    res.status(403).json({ error: `Only ${role}s can do this.` });
    return null;
  }

  return req.session.user;
}
