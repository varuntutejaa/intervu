import { Router } from "express";
import { asyncHandler } from "./asyncHandler.js";
import { pool } from "./db.js";
import { requireRole } from "./requireRole.js";

export const applicationsRouter = Router();

applicationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = await requireRole(req, res, "candidate");
    if (!user) return;

    const result = await pool.query(
      `SELECT a.id, a.status, a.applied_on,
              j.id AS job_id, j.title, j.company, j.location
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       WHERE a.candidate_sub = $1
       ORDER BY a.applied_on DESC`,
      [user.sub],
    );
    res.json(result.rows);
  }),
);

applicationsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const user = await requireRole(req, res, "candidate");
    if (!user) return;

    const { jobId } = req.body ?? {};
    if (!jobId) {
      res.status(400).json({ error: "jobId is required." });
      return;
    }

    const job = await pool.query("SELECT id FROM jobs WHERE id = $1", [jobId]);
    if (job.rowCount === 0) {
      res.status(404).json({ error: "That job no longer exists." });
      return;
    }

    const existing = await pool.query(
      "SELECT id FROM applications WHERE job_id = $1 AND candidate_sub = $2",
      [jobId, user.sub],
    );
    if (existing.rowCount && existing.rowCount > 0) {
      res.json({ status: "already_applied" });
      return;
    }

    await pool.query("INSERT INTO applications (job_id, candidate_sub) VALUES ($1, $2)", [
      jobId,
      user.sub,
    ]);
    res.json({ status: "applied" });
  }),
);
