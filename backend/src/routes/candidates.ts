import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { pool } from "../lib/db.js";
import { requireRole } from "../middleware/requireRole.js";

export const candidatesRouter = Router();

candidatesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = await requireRole(req, res, "recruiter");
    if (!user) return;

    const result = await pool.query(
      `SELECT auth_sub, email, full_name, phone_number, desired_role, location, experience,
              current_status, technical_skills, soft_skills, linkedin_url, github_url, portfolio_url,
              bio, resume_filename, resume_data, resume_uploaded_at, avatar_url
       FROM profiles
       WHERE role = 'candidate'
       ORDER BY updated_at DESC`,
    );
    res.json(result.rows);
  }),
);
