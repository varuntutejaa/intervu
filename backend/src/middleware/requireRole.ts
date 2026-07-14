import type { Request, Response } from "express";
import { pool } from "../lib/db.js";
import { getAuthUser } from "./auth.js";

// One login can hold both a candidate and a recruiter profile at once, so
// authorization is "has this account set up this role" — a row existing for
// (auth_sub, role) — not "is this their only/current role". This check runs
// server-side on every protected route; the frontend hiding buttons is only
// a UX nicety, never the actual gate. 401s/403s directly on the response
// when it doesn't match, so callers can just check for a null return.
export async function requireRole(
  req: Request,
  res: Response,
  role: "candidate" | "recruiter",
): Promise<{ sub: string; email: string } | null> {
  const authUser = getAuthUser(req);
  if (!authUser) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }

  const result = await pool.query(
    "SELECT 1 FROM profiles WHERE auth_sub = $1 AND role = $2",
    [authUser.sub, role],
  );
  if (result.rowCount === 0) {
    res.status(403).json({ error: `Only ${role}s can do this.` });
    return null;
  }

  return authUser;
}
