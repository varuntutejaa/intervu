import { Router } from "express";
import * as resumesController from "../controllers/resumesController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

// A candidate's resume library (multiple named resumes to choose between
// when applying) — distinct from /api/resume/parse, which is the one-off
// AI extraction endpoint used for profile autofill.
export const resumesRouter = Router();

resumesRouter.get("/", asyncHandler(resumesController.list));
resumesRouter.get("/:id", asyncHandler(resumesController.getById));
resumesRouter.post("/", asyncHandler(resumesController.upload));
resumesRouter.put("/:id", asyncHandler(resumesController.replace));
resumesRouter.delete("/:id", asyncHandler(resumesController.remove));
