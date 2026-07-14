import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { pool } from "../lib/db.js";
import { requireRole } from "../middleware/requireRole.js";

export const jobsRouter = Router();

const JOB_FIELDS =
  "id, title, company, location, job_type, work_mode, experience, salary_min, salary_max, description, skills, application_deadline, job_code, status";

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
  asyncHandler(async (req, res) => {
    // Search + filters all happen server-side rather than over an
    // already-fetched list, so this stays correct as the number of postings
    // grows instead of only ever searching whatever page happened to load.
    const { q, jobType, workMode, experience, location } = req.query;
    // Closed postings drop out of the public board entirely — not
    // filterable back in, this isn't a candidate-facing option.
    const conditions: string[] = ["status = 'open'"];
    const params: unknown[] = [];

    if (typeof q === "string" && q.trim()) {
      params.push(`%${q.trim()}%`);
      conditions.push(
        `(title ILIKE $${params.length} OR company ILIKE $${params.length} OR EXISTS (SELECT 1 FROM unnest(skills) s WHERE s ILIKE $${params.length}))`,
      );
    }
    if (typeof jobType === "string" && jobType) {
      params.push(jobType);
      conditions.push(`job_type = $${params.length}`);
    }
    if (typeof workMode === "string" && workMode) {
      params.push(workMode);
      conditions.push(`work_mode = $${params.length}`);
    }
    if (typeof experience === "string" && experience) {
      params.push(experience);
      conditions.push(`experience = $${params.length}`);
    }
    if (typeof location === "string" && location.trim()) {
      params.push(`%${location.trim()}%`);
      conditions.push(`location ILIKE $${params.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await pool.query(
      `SELECT ${JOB_FIELDS} FROM jobs ${where} ORDER BY id DESC`,
      params,
    );
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

// Recruiter's own applicant-pipeline totals: overall counts by status, plus
// a per-job breakdown, across every job they've posted (open or closed).
jobsRouter.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const user = await requireRole(req, res, "recruiter");
    if (!user) return;

    const jobs = await pool.query(
      `SELECT id, title, status FROM jobs WHERE posted_by = $1 ORDER BY id DESC`,
      [user.sub],
    );
    const perStatus = await pool.query(
      `SELECT a.job_id, a.status, count(*)::int AS count
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       WHERE j.posted_by = $1
       GROUP BY a.job_id, a.status`,
      [user.sub],
    );

    const byStatus: Record<string, number> = Object.fromEntries(
      APPLICATION_STATUSES.map((s) => [s, 0]),
    );
    const perJobCounts = new Map<number, { total: number; byStatus: Record<string, number> }>();
    for (const job of jobs.rows) {
      perJobCounts.set(job.id, {
        total: 0,
        byStatus: Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0])),
      });
    }
    for (const row of perStatus.rows) {
      byStatus[row.status] = (byStatus[row.status] ?? 0) + row.count;
      const entry = perJobCounts.get(row.job_id);
      if (entry) {
        entry.total += row.count;
        entry.byStatus[row.status] = row.count;
      }
    }

    const totalApplicants = Object.values(byStatus).reduce((sum, n) => sum + n, 0);

    res.json({
      totalJobs: jobs.rows.length,
      openJobs: jobs.rows.filter((j) => j.status === "open").length,
      totalApplicants,
      byStatus,
      jobs: jobs.rows.map((job) => ({
        id: job.id,
        title: job.title,
        status: job.status,
        ...perJobCounts.get(job.id),
      })),
    });
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
      `SELECT a.id AS application_id, a.status, a.applied_on, a.feedback,
              p.auth_sub, p.email, p.desired_role, p.location, p.experience,
              p.portfolio_url, p.skills, p.bio, p.resume_filename, p.resume_data, p.avatar_url
       FROM applications a
       JOIN profiles p ON p.auth_sub = a.candidate_sub
       WHERE a.job_id = $1
       ORDER BY a.applied_on DESC`,
      [jobId],
    );
    res.json(result.rows);
  }),
);

const APPLICATION_STATUSES = ["Applied", "Scheduled", "Interviewing", "Offer", "Rejected"];

// Lets a recruiter set status and leave feedback (e.g. post-interview
// notes) on an application to one of their own jobs — scoped to jobId so
// the ownership check above is reused, rather than trusting applicationId
// alone.
jobsRouter.patch(
  "/:id/applicants/:applicationId",
  asyncHandler(async (req, res) => {
    const user = await requireRole(req, res, "recruiter");
    if (!user) return;

    const jobId = Number(req.params.id);
    const applicationId = Number(req.params.applicationId);
    if (!Number.isInteger(jobId) || !Number.isInteger(applicationId)) {
      res.status(400).json({ error: "Invalid id." });
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

    const { status, feedback } = req.body ?? {};
    if (status !== undefined && !APPLICATION_STATUSES.includes(status)) {
      res.status(400).json({ error: "Invalid status." });
      return;
    }

    const result = await pool.query(
      `UPDATE applications
       SET status = COALESCE($1, status), feedback = COALESCE($2, feedback)
       WHERE id = $3 AND job_id = $4
       RETURNING id, status, feedback`,
      [status ?? null, feedback ?? null, applicationId, jobId],
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Application not found for this job." });
      return;
    }

    res.json(result.rows[0]);
  }),
);

const JOB_STATUSES = ["open", "closed"];

// Edits a recruiter's own job posting — any subset of fields, including
// `status` ('open'/'closed'), which is how a posting gets closed or
// reopened. COALESCE means omitted fields are left untouched rather than
// wiped, so this doubles as the "close job" action (just { status:
// "closed" }) without needing a separate endpoint.
jobsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await requireRole(req, res, "recruiter");
    if (!user) return;

    const jobId = Number(req.params.id);
    if (!Number.isInteger(jobId)) {
      res.status(400).json({ error: "Invalid job id." });
      return;
    }

    const existing = await pool.query("SELECT posted_by FROM jobs WHERE id = $1", [jobId]);
    if (existing.rowCount === 0) {
      res.status(404).json({ error: "Job not found." });
      return;
    }
    if (existing.rows[0].posted_by !== user.sub) {
      res.status(403).json({ error: "You didn't post this job." });
      return;
    }

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
      status,
    } = req.body ?? {};

    if (status !== undefined && !JOB_STATUSES.includes(status)) {
      res.status(400).json({ error: "Status must be 'open' or 'closed'." });
      return;
    }

    const result = await pool.query(
      `UPDATE jobs SET
         title = COALESCE($1, title),
         company = COALESCE($2, company),
         location = COALESCE($3, location),
         job_type = COALESCE($4, job_type),
         work_mode = COALESCE($5, work_mode),
         experience = COALESCE($6, experience),
         salary_min = COALESCE($7, salary_min),
         salary_max = COALESCE($8, salary_max),
         description = COALESCE($9, description),
         skills = COALESCE($10, skills),
         application_deadline = COALESCE($11, application_deadline),
         status = COALESCE($12, status)
       WHERE id = $13
       RETURNING ${JOB_FIELDS}`,
      [
        title ?? null,
        company ?? null,
        location ?? null,
        jobType ?? null,
        workMode ?? null,
        experience ?? null,
        salaryMin ?? null,
        salaryMax ?? null,
        description ?? null,
        Array.isArray(skills) ? skills : null,
        applicationDeadline ?? null,
        status ?? null,
        jobId,
      ],
    );
    res.json(result.rows[0]);
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
