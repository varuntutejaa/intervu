import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { pool } from "../lib/db.js";
import { requireRole } from "../middleware/requireRole.js";
import { APPLICATION_STATUSES, RECOMMENDATIONS } from "../lib/applicationStatus.js";

export const jobsRouter = Router();

const JOB_FIELDS =
  "id, title, company, location, job_type, work_mode, experience, salary_min, salary_max, description, skills, application_deadline, job_code, status, created_at, travel, discipline, responsibilities, qualifications";

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

    // Platform-wide figures (not scoped to this recruiter's own postings) —
    // "Total candidates" only makes sense across the whole platform, so the
    // rest of this dashboard's aggregate numbers follow the same scope.
    const candidateCount = await pool.query(
      "SELECT count(*)::int AS count FROM profiles WHERE role = 'candidate'",
    );
    const resumeCount = await pool.query(
      "SELECT count(*)::int AS count FROM profiles WHERE role = 'candidate' AND resume_data IS NOT NULL",
    );
    const topCompanies = await pool.query(
      `SELECT COALESCE(a.company, j.company) AS company, count(*)::int AS count
       FROM applications a
       LEFT JOIN jobs j ON j.id = a.job_id
       WHERE COALESCE(a.company, j.company) IS NOT NULL
       GROUP BY COALESCE(a.company, j.company)
       ORDER BY count DESC
       LIMIT 5`,
    );
    // Of applications that at least reached "Interview Scheduled", what
    // share moved past just being scheduled (rounds actually happened,
    // whichever way they ended)? Applications still sitting at "Applied"
    // haven't started the interview process yet, so they're excluded from
    // both sides of this ratio.
    const interviewStages = [
      "Interview Scheduled",
      "Technical Round",
      "HR Round",
      "Offer Received",
      "Rejected",
    ];
    const completedStages = ["Technical Round", "HR Round", "Offer Received", "Rejected"];
    const interviewedCount = await pool.query(
      "SELECT count(*)::int AS count FROM applications WHERE status = ANY($1)",
      [interviewStages],
    );
    const completedCount = await pool.query(
      "SELECT count(*)::int AS count FROM applications WHERE status = ANY($1)",
      [completedStages],
    );
    const totalInterviewed = interviewedCount.rows[0].count;
    const interviewCompletionRate =
      totalInterviewed > 0 ? Math.round((completedCount.rows[0].count / totalInterviewed) * 100) : 0;

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
      totalCandidates: candidateCount.rows[0].count,
      totalResumesUploaded: resumeCount.rows[0].count,
      topCompanies: topCompanies.rows,
      interviewCompletionRate,
    });
  }),
);

// Single-job lookup for the full-page job detail view (public, like GET /
// above — a candidate doesn't need to be logged in to read the posting).
// Not status-filtered, unlike the list endpoint: a direct link to a job
// should still resolve after it's closed (e.g. a recruiter revisiting their
// own posting), the frontend decides what to show based on job.status.
jobsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const jobId = Number(req.params.id);
    if (!Number.isInteger(jobId)) {
      res.status(400).json({ error: "Invalid job id." });
      return;
    }

    const result = await pool.query(`SELECT ${JOB_FIELDS} FROM jobs WHERE id = $1`, [jobId]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Job not found." });
      return;
    }
    res.json(result.rows[0]);
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
              a.feedback_technical_rating, a.feedback_communication_rating, a.feedback_overall_rating,
              a.feedback_strengths, a.feedback_weaknesses, a.feedback_recommendation,
              p.auth_sub, p.email, p.full_name, p.phone_number, p.desired_role, p.location, p.experience,
              p.current_status, p.technical_skills, p.soft_skills, p.linkedin_url, p.github_url,
              p.portfolio_url, p.bio, p.resume_filename, p.resume_data, p.resume_uploaded_at, p.avatar_url
       FROM applications a
       JOIN profiles p ON p.auth_sub = a.candidate_sub
       WHERE a.job_id = $1
       ORDER BY a.applied_on DESC`,
      [jobId],
    );
    res.json(result.rows);
  }),
);

// Lets a recruiter set status and leave structured post-interview feedback
// on an application to one of their own jobs — scoped to jobId so the
// ownership check above is reused, rather than trusting applicationId
// alone. Candidates can only ever see feedback tied to their own
// applications (applications.ts's GET already filters by candidate_sub).
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
    if (status !== undefined && !(APPLICATION_STATUSES as readonly string[]).includes(status)) {
      res.status(400).json({ error: "Invalid status." });
      return;
    }

    const fb = feedback ?? {};
    const ratingFields: [string, unknown][] = [
      ["technicalRating", fb.technicalRating],
      ["communicationRating", fb.communicationRating],
      ["overallRating", fb.overallRating],
    ];
    const ratings: Record<string, number | null> = {};
    for (const [key, value] of ratingFields) {
      if (value === undefined || value === null) {
        ratings[key] = null;
        continue;
      }
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1 || n > 5) {
        res.status(400).json({ error: "Ratings must be whole numbers from 1 to 5." });
        return;
      }
      ratings[key] = n;
    }
    if (
      fb.recommendation !== undefined &&
      fb.recommendation !== null &&
      !(RECOMMENDATIONS as readonly string[]).includes(fb.recommendation)
    ) {
      res.status(400).json({ error: "Invalid recommendation." });
      return;
    }

    const result = await pool.query(
      `UPDATE applications SET
         status = COALESCE($1, status),
         feedback_technical_rating = COALESCE($2, feedback_technical_rating),
         feedback_communication_rating = COALESCE($3, feedback_communication_rating),
         feedback_overall_rating = COALESCE($4, feedback_overall_rating),
         feedback_strengths = COALESCE($5, feedback_strengths),
         feedback_weaknesses = COALESCE($6, feedback_weaknesses),
         feedback_recommendation = COALESCE($7, feedback_recommendation)
       WHERE id = $8 AND job_id = $9
       RETURNING id, status, feedback_technical_rating, feedback_communication_rating,
                 feedback_overall_rating, feedback_strengths, feedback_weaknesses, feedback_recommendation`,
      [
        status ?? null,
        ratings.technicalRating,
        ratings.communicationRating,
        ratings.overallRating,
        fb.strengths ?? null,
        fb.weaknesses ?? null,
        fb.recommendation ?? null,
        applicationId,
        jobId,
      ],
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
      travel,
      discipline,
      responsibilities,
      qualifications,
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
         status = COALESCE($12, status),
         travel = COALESCE($13, travel),
         discipline = COALESCE($14, discipline),
         responsibilities = COALESCE($15, responsibilities),
         qualifications = COALESCE($16, qualifications)
       WHERE id = $17
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
        travel ?? null,
        discipline ?? null,
        responsibilities ?? null,
        qualifications ?? null,
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
      travel,
      discipline,
      responsibilities,
      qualifications,
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
         job_code, posted_by, travel, discipline, responsibilities, qualifications
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
        travel ?? null,
        discipline ?? null,
        responsibilities ?? null,
        qualifications ?? null,
      ],
    );
    res.json(result.rows[0]);
  }),
);
