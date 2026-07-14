import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { pool } from "../lib/db.js";
import { requireRole } from "../middleware/requireRole.js";

export const jobsRouter = Router();

const JOB_FIELDS =
  "id, title, company, location, job_type, work_mode, experience, salary_min, salary_max, description, skills, application_deadline, job_code";

// Random 6-digit reference code for a new posting, retried on the rare
// collision instead of relying on a DB-level unique constraint.
async function generateJobCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const existing = await pool.query("SELECT 1 FROM jobs WHERE job_code = $1", [code]);
    if (existing.rowCount === 0) return code;
  }
  throw new Error("Couldn't generate a unique job code.");
}

jobsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const result = await pool.query(`SELECT ${JOB_FIELDS} FROM jobs ORDER BY id`);
    res.json(result.rows);
  }),
);

jobsRouter.get(
  "/mine",
  asyncHandler(async (req, res) => {
    const user = await requireRole(req, res, "recruiter");
    if (!user) return;

    const result = await pool.query(
      `SELECT ${JOB_FIELDS} FROM jobs WHERE posted_by = $1 ORDER BY id DESC`,
      [user.sub],
    );
    res.json(result.rows);
  }),
);

jobsRouter.get(
  "/:id/applicants",
  asyncHandler(async (req, res) => {
    const user = await requireRole(req, res, "recruiter");
    if (!user) return;

    const jobId = Number(req.params.id);
    if (!Number.isInteger(jobId)) {
      res.status(400).json({ error: "Invalid job id." });
      return;
    }

    const job = await pool.query("SELECT posted_by FROM jobs WHERE id = $1", [jobId]);
    if (job.rowCount === 0) {
      res.status(404).json({ error: "Job not found." });
      return;
    }
    if (job.rows[0].posted_by !== user.sub) {
      res.status(403).json({ error: "You didn't post this job." });
      return;
    }

    const result = await pool.query(
      `SELECT a.id AS application_id, a.status, a.applied_on,
              p.auth_sub, p.email, p.desired_role, p.location, p.experience,
              p.portfolio_url, p.skills, p.bio, p.resume_filename, p.avatar_url
       FROM applications a
       JOIN profiles p ON p.auth_sub = a.candidate_sub
       WHERE a.job_id = $1
       ORDER BY a.applied_on DESC`,
      [jobId],
    );
    res.json(result.rows);
  }),
);

jobsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const user = await requireRole(req, res, "recruiter");
    if (!user) return;

    const {
      title,
      company,
      location,
      jobType,
      workMode,
      experience,
      salaryMin,
      salaryMax,
      description,
      skills,
      applicationDeadline,
    } = req.body ?? {};
    if (!title || !company || !location || !jobType || !workMode || !experience) {
      res.status(400).json({
        error: "Title, company, location, job type, work mode, and experience are required.",
      });
      return;
    }

    const jobCode = await generateJobCode();

    const result = await pool.query(
      `INSERT INTO jobs (
         title, company, location, job_type, work_mode, experience,
         salary_min, salary_max, description, skills, application_deadline,
         job_code, posted_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING ${JOB_FIELDS}`,
      [
        title,
        company,
        location,
        jobType,
        workMode,
        experience,
        salaryMin ?? null,
        salaryMax ?? null,
        description ?? null,
        Array.isArray(skills) ? skills : [],
        applicationDeadline ?? null,
        jobCode,
        user.sub,
      ],
    );
    res.json(result.rows[0]);
  }),
);
