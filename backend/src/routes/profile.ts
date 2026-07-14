import { Router } from "express";
import { asyncHandler } from "./asyncHandler.js";
import { pool } from "./db.js";

export const profileRouter = Router();

profileRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    if (!req.session.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const result = await pool.query("SELECT * FROM profiles WHERE auth_sub = $1", [
      req.session.user.sub,
    ]);
    res.json({ profile: result.rows[0] ?? null });
  }),
);

profileRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    if (!req.session.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { role, fields } = req.body ?? {};
    if (role !== "candidate" && role !== "recruiter") {
      res.status(400).json({ error: "Role must be 'candidate' or 'recruiter'." });
      return;
    }

    const f = fields ?? {};
    const { sub, email } = req.session.user;

    await pool.query(
      `INSERT INTO profiles (
         auth_sub, email, role,
         desired_role, location, experience, portfolio_url, skills, bio, resume_filename,
         company_name, job_title, company_website, company_size, industry, company_bio, company_logo_filename,
         avatar_url,
         updated_at
       ) VALUES (
         $1, $2, $3,
         $4, $5, $6, $7, $8, $9, $10,
         $11, $12, $13, $14, $15, $16, $17,
         $18,
         now()
       )
       ON CONFLICT (auth_sub) DO UPDATE SET
         email = EXCLUDED.email,
         role = EXCLUDED.role,
         desired_role = EXCLUDED.desired_role,
         location = EXCLUDED.location,
         experience = EXCLUDED.experience,
         portfolio_url = EXCLUDED.portfolio_url,
         skills = EXCLUDED.skills,
         bio = EXCLUDED.bio,
         resume_filename = EXCLUDED.resume_filename,
         company_name = EXCLUDED.company_name,
         job_title = EXCLUDED.job_title,
         company_website = EXCLUDED.company_website,
         company_size = EXCLUDED.company_size,
         industry = EXCLUDED.industry,
         company_bio = EXCLUDED.company_bio,
         company_logo_filename = EXCLUDED.company_logo_filename,
         avatar_url = EXCLUDED.avatar_url,
         updated_at = now()`,
      [
        sub,
        email,
        role,
        f.desiredRole ?? null,
        f.location ?? null,
        f.experience ?? null,
        f.portfolioUrl ?? null,
        f.skills ?? null,
        f.bio ?? null,
        f.resumeFilename ?? null,
        f.companyName ?? null,
        f.jobTitle ?? null,
        f.companyWebsite ?? null,
        f.companySize ?? null,
        f.industry ?? null,
        f.companyBio ?? null,
        f.companyLogoFilename ?? null,
        f.avatarUrl ?? null,
      ],
    );

    res.json({ status: "saved" });
  }),
);
