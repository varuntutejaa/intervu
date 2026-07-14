import { pool } from "./db.js";

// One login can hold both a candidate and a recruiter profile — these
// helpers answer "which roles has this account set up" and "which one
// should be active by default", shared by every login path (Cognito,
// Google, GitHub) and the switch-role endpoint.
export async function getRolesForSub(sub: string): Promise<("candidate" | "recruiter")[]> {
  const result = await pool.query("SELECT role FROM profiles WHERE auth_sub = $1", [sub]);
  return result.rows.map((row) => row.role);
}

export async function resolveActiveRole(sub: string): Promise<"candidate" | "recruiter" | null> {
  const result = await pool.query(
    "SELECT role FROM profiles WHERE auth_sub = $1 ORDER BY updated_at DESC LIMIT 1",
    [sub],
  );
  return result.rows[0]?.role ?? null;
}
