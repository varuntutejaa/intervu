import { Router } from "express";
import * as jobsController from "../controllers/jobsController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const jobsRouter = Router();

// Static paths ("/mine", "/stats") must be registered before the "/:id"
// param route below, or Express would match e.g. GET /mine as id="mine".
jobsRouter.get("/", asyncHandler(jobsController.list));
jobsRouter.get("/mine", asyncHandler(jobsController.listMine));
jobsRouter.get("/stats", asyncHandler(jobsController.stats));
jobsRouter.get("/trending-companies", asyncHandler(jobsController.trendingCompanies));

// Single-job lookup for the full-page job detail view (public — a candidate
// doesn't need to be logged in to read the posting). Not status-filtered,
// unlike the list endpoint: a direct link to a job should still resolve
// after it's closed, the frontend decides what to show based on job.status.
jobsRouter.get("/:id", asyncHandler(jobsController.getById));
jobsRouter.get("/:id/applicants", asyncHandler(jobsController.listApplicants));
jobsRouter.get("/:id/applicants/:applicationId", asyncHandler(jobsController.getApplicant));
jobsRouter.patch("/:id/applicants/:applicationId", asyncHandler(jobsController.updateApplicant));
jobsRouter.patch("/:id", asyncHandler(jobsController.update));
jobsRouter.post("/", asyncHandler(jobsController.create));
