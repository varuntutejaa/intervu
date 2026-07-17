import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { answerQuestion } from "../rag/ragService.js";

export const chatRouter = Router();

chatRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
    if (!question) {
      res.status(400).json({ error: "question is required" });
      return;
    }

    const { answer, citations } = await answerQuestion(question);
    res.json({ answer, citations });
  }),
);
