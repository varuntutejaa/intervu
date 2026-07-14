import type { Request, Response } from "express";
import { pool } from "../lib/db.js";

// One login can hold both a candidate and a recruiter profile at once (see
// activeRole in the session), so authorization is "has this account set up
// this role" — a row existing for (auth_sub, role) — not "is this their
// only/current role". 401s/403s directly on the response when it doesn't
// match, so callers can just check for a null return.
export async function requireRole(
  req: Request,
  res: Response,
  role: "candidate" | "recruiter",
): Promise<{ sub: string; email: string } | null> {
  if (!req.session.user) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }

  const result = await pool.query(
    "SELECT 1 FROM profiles WHERE auth_sub = $1 AND role = $2",
    [req.session.user.sub, role],
  );
  if (result.rowCount === 0) {
    res.status(403).json({ error: `Only ${role}s can do this.` });
    return null;
  }

  return req.session.user;
}
