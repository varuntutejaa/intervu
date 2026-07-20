import { Router } from "express";
import * as oauthController from "../controllers/oauthController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const oauthRouter = Router();

oauthRouter.get("/google/start", oauthController.googleStart);
oauthRouter.get("/google/callback", asyncHandler(oauthController.googleCallback));
