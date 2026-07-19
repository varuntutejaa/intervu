import { Router } from "express";
import * as applicationsController from "../controllers/applicationsController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const applicationsRouter = Router();

// Candidates can track applications to jobs actually posted on this
// platform (job_id set) alongside ones they applied to elsewhere and are
// just logging here (job_id NULL, company/position_title filled in
// directly) — GET unifies both under one paginated, filterable list.
applicationsRouter.get("/", asyncHandler(applicationsController.list));
applicationsRouter.get("/notifications", asyncHandler(applicationsController.notifications));
applicationsRouter.post("/", asyncHandler(applicationsController.create));
applicationsRouter.patch("/:id", asyncHandler(applicationsController.update));
applicationsRouter.patch("/:id/withdraw", asyncHandler(applicationsController.withdraw));
applicationsRouter.delete("/:id", asyncHandler(applicationsController.remove));
