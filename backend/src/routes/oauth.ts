import { Router } from "express";
import * as oauthController from "../controllers/oauthController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const oauthRouter = Router();

oauthRouter.get("/google/start", oauthController.googleStart);
oauthRouter.get("/google/callback", asyncHandler(oauthController.googleCallback));
oauthRouter.get("/github/start", oauthController.githubStart);
oauthRouter.get("/github/callback", asyncHandler(oauthController.githubCallback));
