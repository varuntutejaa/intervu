import { pool } from "../lib/db.js";

const CANDIDATE_FIELDS = `auth_sub, email, full_name, phone_number, desired_role, location, experience,
       current_status, technical_skills, soft_skills, linkedin_url, github_url, portfolio_url,
       bio, resume_filename, resume_data, resume_uploaded_at, avatar_url`;

export async function findCandidates(limit: number, offset: number) {
  const result = await pool.query(
    `SELECT ${CANDIDATE_FIELDS} FROM profiles
     WHERE role = 'candidate'
     ORDER BY updated_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  return result.rows;
}

export async function countCandidates(): Promise<number> {
  const result = await pool.query("SELECT count(*)::int AS count FROM profiles WHERE role = 'candidate'");
  return result.rows[0].count;
}
