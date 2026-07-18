import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getAuthUser } from "../middleware/auth.js";
import { pool } from "../lib/db.js";
import { extractPdfText } from "../lib/pdfText.js";
import { answerQuestion } from "../rag/ragService.js";

export const chatRouter = Router();

// Resumes run long; cap well under the model's context window (matches
// resume.ts's extraction cap).
const RESUME_TEXT_CHAR_CAP = 12000;

// The assistant is usable both logged out (landing page demo, generic
// guidance only) and logged in (personalized against the candidate's own
// uploaded resume) — so auth here is optional, not required.
async function loadStoredResumeText(req: Parameters<typeof getAuthUser>[0]): Promise<string | undefined> {
  const authUser = getAuthUser(req);
  if (!authUser) return undefined;

  const result = await pool.query<{ resume_data: string | null }>(
    "SELECT resume_data FROM profiles WHERE auth_sub = $1 AND role = 'candidate'",
    [authUser.sub],
  );
  const resumeData = result.rows[0]?.resume_data;
  if (!resumeData) return undefined;

  return extractPdfText(resumeData);
}

chatRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
    if (!question) {
      res.status(400).json({ error: "question is required" });
      return;
    }

    // A resume attached directly in the chat message (landing-page "attach
    // resume" flow, works logged out) takes priority over a stored profile
    // resume — it's the more specific, explicitly-provided document for
    // this question.
    const attachedResumeData = typeof req.body?.resumeData === "string" ? req.body.resumeData : undefined;
    const resumeText = attachedResumeData
      ? await extractPdfText(attachedResumeData)
      : await loadStoredResumeText(req);

    const { answer, citations } = await answerQuestion(question, resumeText?.slice(0, RESUME_TEXT_CHAR_CAP));
    res.json({ answer, citations });
  }),
);
