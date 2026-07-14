import { Router } from "express";
import { asyncHandler } from "./asyncHandler.js";
import { pool } from "./db.js";
import { requireRole } from "./requireRole.js";

export const candidatesRouter = Router();

candidatesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = await requireRole(req, res, "recruiter");
    if (!user) return;

    const result = await pool.query(
      `SELECT auth_sub, email, desired_role, location, experience, portfolio_url,
              skills, bio, resume_filename, avatar_url
       FROM profiles
       WHERE role = 'candidate'
       ORDER BY updated_at DESC`,
    );
    res.json(result.rows);
  }),
);
