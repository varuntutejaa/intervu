import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { pool } from "../lib/db.js";
import { requireRole } from "../middleware/requireRole.js";
import { APPLICATION_STATUSES } from "../lib/applicationStatus.js";

export const applicationsRouter = Router();

const APPLICATION_FIELDS = `
  a.id, a.status, a.applied_on, a.job_id,
  COALESCE(a.company, j.company) AS company,
  COALESCE(a.position_title, j.title) AS title,
  j.location,
  a.feedback_technical_rating, a.feedback_communication_rating, a.feedback_overall_rating,
  a.feedback_strengths, a.feedback_weaknesses, a.feedback_recommendation
`;

// Candidates can track applications to jobs actually posted on this
// platform (job_id set) alongside ones they applied to elsewhere and are
// just logging here (job_id NULL, company/position_title filled in
// directly) — this view unifies both under one list via LEFT JOIN +
// COALESCE, since search/filter/sort need to work the same way for either.
applicationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = await requireRole(req, res, "candidate");
    if (!user) return;

    const { q, status, sort } = req.query;
    const conditions: string[] = ["a.candidate_sub = $1"];
    const params: unknown[] = [user.sub];

    if (typeof q === "string" && q.trim()) {
      params.push(`%${q.trim()}%`);
      conditions.push(
        `(COALESCE(a.company, j.company) ILIKE $${params.length} OR COALESCE(a.position_title, j.title) ILIKE $${params.length})`,
      );
    }
    if (typeof status === "string" && (APPLICATION_STATUSES as readonly string[]).includes(status)) {
      params.push(status);
      conditions.push(`a.status = $${params.length}`);
    }

    const order = sort === "asc" ? "ASC" : "DESC";

    const result = await pool.query(
      `SELECT ${APPLICATION_FIELDS}
       FROM applications a
       LEFT JOIN jobs j ON j.id = a.job_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY a.applied_on ${order}, a.id ${order}`,
      params,
    );
    res.json(result.rows);
  }),
);

applicationsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const user = await requireRole(req, res, "candidate");
    if (!user) return;

    const { jobId, company, position, appliedOn, status } = req.body ?? {};

    // Applying to a real posting on the platform.
    if (jobId !== undefined && jobId !== null) {
      const id = Number(jobId);
      if (!Number.isInteger(id)) {
        res.status(400).json({ error: "Invalid jobId." });
        return;
      }
      const job = await pool.query("SELECT id FROM jobs WHERE id = $1", [id]);
      if (job.rowCount === 0) {
        res.status(404).json({ error: "That job no longer exists." });
        return;
      }
      // ON CONFLICT closes the race a separate check-then-insert would leave
      // open between two near-simultaneous submissions for the same job.
      const result = await pool.query(
        `INSERT INTO applications (job_id, candidate_sub)
         VALUES ($1, $2)
         ON CONFLICT (job_id, candidate_sub) DO NOTHING
         RETURNING id`,
        [id, user.sub],
      );
      res.json({ status: result.rowCount ? "applied" : "already_applied" });
      return;
    }

    // Manually logging an application made outside the platform.
    if (!company || !position) {
      res.status(400).json({ error: "Company and position are required." });
      return;
    }
    if (status !== undefined && !(APPLICATION_STATUSES as readonly string[]).includes(status)) {
      res.status(400).json({ error: "Invalid status." });
      return;
    }

    const result = await pool.query(
      `INSERT INTO applications (candidate_sub, company, position_title, status, applied_on)
       VALUES ($1, $2, $3, COALESCE($4::application_status, 'Applied'), COALESCE($5::date, CURRENT_DATE))
       RETURNING id`,
      [user.sub, company, position, status ?? null, appliedOn ?? null],
    );
    res.json({ status: "created", id: result.rows[0].id });
  }),
);

// Candidates can freely edit/re-status applications they're just logging
// for their own tracking (job_id NULL — applied somewhere off-platform, no
// recruiter involved at all). For a real posting on this platform (job_id
// set), the recruiter owns status changes (jobs.ts's PATCH
// /:id/applicants/:applicationId) — the candidate's only action on those is
// to withdraw (see PATCH /:id/withdraw below), not set an arbitrary status
// or edit the company/position/date, which come from the job itself anyway.
applicationsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await requireRole(req, res, "candidate");
    if (!user) return;

    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid id." });
      return;
    }

    const existing = await pool.query(
      "SELECT job_id FROM applications WHERE id = $1 AND candidate_sub = $2",
      [id, user.sub],
    );
    if (existing.rowCount === 0) {
      res.status(404).json({ error: "Application not found." });
      return;
    }
    if (existing.rows[0].job_id !== null) {
      res.status(403).json({
        error: "This application is to a real posting — only the recruiter can change its status. You can withdraw it instead.",
      });
      return;
    }

    const { status, company, position, appliedOn } = req.body ?? {};
    if (status !== undefined && !(APPLICATION_STATUSES as readonly string[]).includes(status)) {
      res.status(400).json({ error: "Invalid status." });
      return;
    }

    await pool.query(
      `UPDATE applications SET
         status = COALESCE($1, status),
         company = COALESCE($2, company),
         position_title = COALESCE($3, position_title),
         applied_on = COALESCE($4, applied_on)
       WHERE id = $5 AND candidate_sub = $6`,
      [status ?? null, company ?? null, position ?? null, appliedOn ?? null, id, user.sub],
    );
    res.json({ status: "updated" });
  }),
);

// The only status change a candidate can make on an application to a real
// posting — preserves the row (and any recruiter feedback already left on
// it) instead of deleting it, so the recruiter can still see the candidate
// withdrew rather than the application just vanishing.
applicationsRouter.patch(
  "/:id/withdraw",
  asyncHandler(async (req, res) => {
    const user = await requireRole(req, res, "candidate");
    if (!user) return;

    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid id." });
      return;
    }

    const result = await pool.query(
      `UPDATE applications SET status = 'Withdrawn'
       WHERE id = $1 AND candidate_sub = $2
       RETURNING id`,
      [id, user.sub],
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Application not found." });
      return;
    }
    res.json({ status: "withdrawn" });
  }),
);

// Deleting is only for a candidate's own off-platform tracking entries
// (job_id NULL) — an application to a real posting can only be withdrawn
// (above), never deleted, so the recruiter's view of it is never silently
// pulled out from under them.
applicationsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await requireRole(req, res, "candidate");
    if (!user) return;

    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid id." });
      return;
    }

    const existing = await pool.query(
      "SELECT job_id FROM applications WHERE id = $1 AND candidate_sub = $2",
      [id, user.sub],
    );
    if (existing.rowCount === 0) {
      res.status(404).json({ error: "Application not found." });
      return;
    }
    if (existing.rows[0].job_id !== null) {
      res.status(403).json({ error: "Applications to a real posting can only be withdrawn, not deleted." });
      return;
    }

    await pool.query("DELETE FROM applications WHERE id = $1 AND candidate_sub = $2", [id, user.sub]);
    res.json({ status: "deleted" });
  }),
);
