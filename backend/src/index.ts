import "dotenv/config";
import cors from "cors";
import express from "express";
import session from "express-session";
import type { NextFunction, Request, Response } from "express";
import { pool } from "./lib/db.js";
import { asyncHandler } from "./middleware/asyncHandler.js";
import { applicationsRouter } from "./routes/applications.js";
import { authRouter } from "./routes/auth.js";
import { candidatesRouter } from "./routes/candidates.js";
import { jobsRouter } from "./routes/jobs.js";
import { oauthRouter } from "./routes/oauth.js";
import { profileRouter } from "./routes/profile.js";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5174",
    credentials: true,
  }),
);
// Default 100kb is too small for a base64-encoded avatar (up to 2MB raw)
// and resume (up to 4MB raw) sent together as part of the profile payload.
app.use(express.json({ limit: "10mb" }));
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "dev-only-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  }),
);

app.use("/api/auth", authRouter);
app.use("/api/auth", oauthRouter);
app.use("/api/profile", profileRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/candidates", candidatesRouter);
app.use("/api/applications", applicationsRouter);

app.get(
  "/api/health",
  asyncHandler(async (_req, res) => {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  }),
);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
