import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { pinoHttp } from "pino-http";
import type { Request } from "express";
import swaggerUi from "swagger-ui-express";
import { pool } from "./lib/db.js";
import { logger } from "./lib/logger.js";
import { asyncHandler } from "./middleware/asyncHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { responseEnvelope } from "./middleware/responseEnvelope.js";
import { applicationsRouter } from "./routes/applications.js";
import { authRouter } from "./routes/auth.js";
import { candidatesRouter } from "./routes/candidates.js";
import { chatRouter } from "./routes/chat.js";
import { jobsRouter } from "./routes/jobs.js";
import { oauthRouter } from "./routes/oauth.js";
import { profileRouter } from "./routes/profile.js";
import { resumeRouter } from "./routes/resume.js";
import { resumesRouter } from "./routes/resumes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const openApiDocument = JSON.parse(readFileSync(path.join(__dirname, "../openapi.json"), "utf-8"));

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
app.use(cookieParser());
// Structured request logging (method, path, status, duration, request id)
// for every request — replaces scattered console.log calls with one
// consistent, machine-parseable line per request.
app.use(
  pinoHttp({
    logger,
    autoLogging: { ignore: (req: Request) => req.url === "/api/health" },
    // Resumes/avatars ride along as base64 in profile payloads — never let
    // those (or auth credentials) end up in a log line.
    redact: [
      "req.body.fields.resumeData",
      "req.body.fields.avatarUrl",
      "req.body.resumeData",
      "req.body.data",
      "req.body.password",
      "req.headers.cookie",
    ],
  }),
);

// Interactive API docs generated from openapi.json — also importable
// directly into Postman/Swagger Editor as a portable spec. Registered
// before responseEnvelope so the raw spec stays a standalone, unwrapped
// document — every business route after this point gets the envelope.
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.get("/api/openapi.json", (_req, res) => res.json(openApiDocument));

// Wraps every response from here down in a consistent { success, data } /
// { success: false, error } shape — see middleware/responseEnvelope.ts.
app.use(responseEnvelope);

app.use("/api/auth", authRouter);
app.use("/api/auth", oauthRouter);
app.use("/api/profile", profileRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/candidates", candidatesRouter);
app.use("/api/applications", applicationsRouter);
app.use("/api/chat", chatRouter);
app.use("/api/resume", resumeRouter);
app.use("/api/resumes", resumesRouter);

app.get(
  "/api/health",
  asyncHandler(async (_req, res) => {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  }),
);

// Must be registered after every route — Express only routes an error to a
// 4-arg middleware, and only the last one registered wins.
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`API listening on http://localhost:${port}`);
});
