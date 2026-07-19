import { Router } from "express";
import * as chatController from "../controllers/chatController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const chatRouter = Router();

chatRouter.post("/", asyncHandler(chatController.ask));
