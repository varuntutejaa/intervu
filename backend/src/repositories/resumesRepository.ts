import { pool } from "../lib/db.js";

export async function findResumesForCandidate(candidateSub: string) {
  const result = await pool.query(
    "SELECT id, filename, uploaded_at FROM resumes WHERE candidate_sub = $1 ORDER BY uploaded_at DESC",
    [candidateSub],
  );
  return result.rows;
}

export async function insertResume(candidateSub: string, filename: string, data: string): Promise<number> {
  const result = await pool.query<{ id: number }>(
    "INSERT INTO resumes (candidate_sub, filename, data) VALUES ($1, $2, $3) RETURNING id",
    [candidateSub, filename, data],
  );
  return result.rows[0].id;
}

export async function deleteResume(id: number, candidateSub: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM resumes WHERE id = $1 AND candidate_sub = $2 RETURNING id", [
    id,
    candidateSub,
  ]);
  return (result.rowCount ?? 0) > 0;
}

export async function findResumeOwner(id: number): Promise<string | null | undefined> {
  const result = await pool.query<{ candidate_sub: string }>("SELECT candidate_sub FROM resumes WHERE id = $1", [id]);
  if (result.rowCount === 0) return undefined;
  return result.rows[0].candidate_sub;
}

// Full detail including the file data — separate from findResumesForCandidate
// (the list query), which deliberately excludes `data` to keep the library
// list light. Fetched on demand for a single resume when a candidate wants
// to actually open/view it.
export async function findResumeById(id: number) {
  const result = await pool.query(
    "SELECT id, candidate_sub, filename, data, uploaded_at FROM resumes WHERE id = $1",
    [id],
  );
  return result.rows[0] ?? null;
}

export async function replaceResume(id: number, filename: string, data: string): Promise<void> {
  await pool.query("UPDATE resumes SET filename = $1, data = $2, uploaded_at = now() WHERE id = $3", [
    filename,
    data,
    id,
  ]);
}
