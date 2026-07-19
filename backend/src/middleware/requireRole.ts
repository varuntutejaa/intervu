import type { Request } from "express";
import { pool } from "../lib/db.js";
import { forbidden, unauthorized } from "../lib/httpError.js";
import { getAuthUser } from "./auth.js";

// One login can hold both a candidate and a recruiter profile at once, so
// authorization is "has this account set up this role" — a row existing for
// (auth_sub, role) — not "is this their only/current role". This check runs
// server-side on every protected route; the frontend hiding buttons is only
// a UX nicety, never the actual gate. Throws (rather than writing to `res`
// itself) so it can be called from the service layer and let asyncHandler's
// catch -> errorHandler pipeline turn it into the right response.
export async function requireRole(
  req: Request,
  role: "candidate" | "recruiter",
): Promise<{ sub: string; email: string; name?: string }> {
  const authUser = getAuthUser(req);
  if (!authUser) throw unauthorized();

  const result = await pool.query("SELECT 1 FROM profiles WHERE auth_sub = $1 AND role = $2", [
    authUser.sub,
    role,
  ]);
  if (result.rowCount === 0) throw forbidden(`Only ${role}s can do this.`);

  return authUser;
}
