import { Router } from "express";
import * as profileController from "../controllers/profileController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const profileRouter = Router();

profileRouter.get("/", asyncHandler(profileController.get));
profileRouter.post("/", asyncHandler(profileController.save));
profileRouter.delete("/resume", asyncHandler(profileController.deleteResume));
