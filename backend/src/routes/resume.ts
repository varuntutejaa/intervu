import { Router } from "express";
import * as resumeController from "../controllers/resumeController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const resumeRouter = Router();

resumeRouter.post("/parse", asyncHandler(resumeController.parse));
