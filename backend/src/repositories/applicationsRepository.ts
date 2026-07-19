import { pool } from "../lib/db.js";
import type { ApplicationStatus } from "../lib/applicationStatus.js";

const APPLICATION_FIELDS = `
  a.id, a.status, a.applied_on, a.job_id,
  COALESCE(a.company, j.company) AS company,
  COALESCE(a.position_title, j.title) AS title,
  j.location,
  a.feedback_technical_rating, a.feedback_communication_rating, a.feedback_overall_rating,
  a.feedback_strengths, a.feedback_weaknesses, a.feedback_recommendation
`;

export interface ApplicationFilters {
  candidateSub: string;
  q?: string;
  status?: string;
  sort?: "asc" | "desc";
}

function buildWhere(filters: ApplicationFilters): { where: string; params: unknown[] } {
  const conditions: string[] = ["a.candidate_sub = $1"];
  const params: unknown[] = [filters.candidateSub];

  if (filters.q) {
    params.push(`%${filters.q}%`);
    conditions.push(
      `(COALESCE(a.company, j.company) ILIKE $${params.length} OR COALESCE(a.position_title, j.title) ILIKE $${params.length})`,
    );
  }
  if (filters.status) {
    params.push(filters.status);
    conditions.push(`a.status = $${params.length}`);
  }

  return { where: conditions.join(" AND "), params };
}

export async function findApplications(filters: ApplicationFilters, limit: number, offset: number) {
  const { where, params } = buildWhere(filters);
  const order = filters.sort === "asc" ? "ASC" : "DESC";
  params.push(limit, offset);

  const result = await pool.query(
    `SELECT ${APPLICATION_FIELDS}
     FROM applications a
     LEFT JOIN jobs j ON j.id = a.job_id
     WHERE ${where}
     ORDER BY a.applied_on ${order}, a.id ${order}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return result.rows;
}

export async function countApplications(filters: ApplicationFilters): Promise<number> {
  const { where, params } = buildWhere(filters);
  const result = await pool.query(
    `SELECT count(*)::int AS count FROM applications a LEFT JOIN jobs j ON j.id = a.job_id WHERE ${where}`,
    params,
  );
  return result.rows[0].count;
}

// One row per application, most-recently-active first — the service layer
// turns each into either an "applied" or "status changed" notification
// depending on whether status has moved past 'Applied'. There's no event
// log table, so this reflects each application's current state rather than
// a full history (e.g. Applied -> Interview Scheduled -> Rejected only
// ever shows as one "Rejected" notification, not three).
export async function findRecentActivity(candidateSub: string, limit: number) {
  const result = await pool.query(
    `SELECT a.id AS application_id, a.status, a.applied_on, a.updated_at,
            COALESCE(a.company, j.company) AS company,
            COALESCE(a.position_title, j.title) AS title
     FROM applications a
     LEFT JOIN jobs j ON j.id = a.job_id
     WHERE a.candidate_sub = $1
     ORDER BY GREATEST(a.applied_on::timestamptz, a.updated_at) DESC
     LIMIT $2`,
    [candidateSub, limit],
  );
  return result.rows;
}

export async function jobExists(jobId: number): Promise<boolean> {
  const result = await pool.query("SELECT 1 FROM jobs WHERE id = $1", [jobId]);
  return (result.rowCount ?? 0) > 0;
}

export async function insertJobApplication(
  jobId: number,
  candidateSub: string,
  resumeId: number | null,
): Promise<boolean> {
  // ON CONFLICT closes the race a separate check-then-insert would leave
  // open between two near-simultaneous submissions for the same job.
  const result = await pool.query(
    `INSERT INTO applications (job_id, candidate_sub, resume_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (job_id, candidate_sub) DO NOTHING
     RETURNING id`,
    [jobId, candidateSub, resumeId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function insertManualApplication(
  candidateSub: string,
  company: string,
  position: string,
  status: ApplicationStatus | null,
  appliedOn: string | null,
): Promise<number> {
  const result = await pool.query(
    `INSERT INTO applications (candidate_sub, company, position_title, status, applied_on)
     VALUES ($1, $2, $3, COALESCE($4::application_status, 'Applied'), COALESCE($5::date, CURRENT_DATE))
     RETURNING id`,
    [candidateSub, company, position, status, appliedOn],
  );
  return result.rows[0].id;
}

export async function findOwnedApplicationJobId(id: number, candidateSub: string): Promise<number | null | undefined> {
  const result = await pool.query<{ job_id: number | null }>(
    "SELECT job_id FROM applications WHERE id = $1 AND candidate_sub = $2",
    [id, candidateSub],
  );
  if (result.rowCount === 0) return undefined; // not found
  return result.rows[0].job_id; // null = manual entry, number = real job
}

export async function updateApplication(
  id: number,
  candidateSub: string,
  fields: { status: ApplicationStatus | null; company: string | null; position: string | null; appliedOn: string | null },
): Promise<void> {
  await pool.query(
    `UPDATE applications SET
       status = COALESCE($1, status),
       company = COALESCE($2, company),
       position_title = COALESCE($3, position_title),
       applied_on = COALESCE($4, applied_on)
     WHERE id = $5 AND candidate_sub = $6`,
    [fields.status, fields.company, fields.position, fields.appliedOn, id, candidateSub],
  );
}

export async function withdrawApplication(id: number, candidateSub: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE applications SET status = 'Withdrawn' WHERE id = $1 AND candidate_sub = $2 RETURNING id`,
    [id, candidateSub],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function deleteApplication(id: number, candidateSub: string): Promise<void> {
  await pool.query("DELETE FROM applications WHERE id = $1 AND candidate_sub = $2", [id, candidateSub]);
}
