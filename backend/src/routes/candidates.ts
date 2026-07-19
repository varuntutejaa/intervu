import { Router } from "express";
import * as candidatesController from "../controllers/candidatesController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const candidatesRouter = Router();

candidatesRouter.get("/", asyncHandler(candidatesController.list));
