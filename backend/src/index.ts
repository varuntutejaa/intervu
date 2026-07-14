import "dotenv/config";
import cors from "cors";
import express from "express";
import session from "express-session";
import type { NextFunction, Request, Response } from "express";
import { applicationsRouter } from "./applicationsRoutes.js";
import { asyncHandler } from "./asyncHandler.js";
import { authRouter } from "./authRoutes.js";
import { candidatesRouter } from "./candidatesRoutes.js";
import { pool } from "./db.js";
import { jobsRouter } from "./jobsRoutes.js";
import { profileRouter } from "./profileRoutes.js";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5174",
    credentials: true,
  }),
);
// Default 100kb is too small for a base64-encoded profile picture (up to
// 2MB raw, ~2.7MB encoded) sent as part of the profile JSON payload.
app.use(express.json({ limit: "5mb" }));
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
