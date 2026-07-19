import type { Request } from "express";
import { extractPdfText } from "../lib/pdfText.js";
import { getAuthUser } from "../middleware/auth.js";
import { findCandidateResumeData } from "../repositories/profileRepository.js";
import { answerQuestion } from "../rag/ragService.js";
import { askChatSchema } from "../schemas/chatSchemas.js";

// Resumes run long; cap well under the model's context window (matches
// resume.ts's extraction cap).
const RESUME_TEXT_CHAR_CAP = 12000;

// The assistant is usable both logged out (landing page demo, generic
// guidance only) and logged in (personalized against the candidate's own
// uploaded resume) — so auth here is optional, not required.
async function loadStoredResumeText(req: Request): Promise<string | undefined> {
  const authUser = getAuthUser(req);
  if (!authUser) return undefined;

  const resumeData = await findCandidateResumeData(authUser.sub);
  if (!resumeData) return undefined;

  return (await extractPdfText(resumeData)) || undefined;
}

export async function ask(req: Request, rawInput: unknown) {
  const { question, resumeData: attachedResumeData } = askChatSchema.parse(rawInput);

  // A resume attached directly in the chat message (landing-page "attach
  // resume" flow, works logged out) takes priority over a stored profile
  // resume — it's the more specific, explicitly-provided document for this
  // question.
  const resumeText = attachedResumeData
    ? await extractPdfText(attachedResumeData)
    : await loadStoredResumeText(req);

  return answerQuestion(question, resumeText?.slice(0, RESUME_TEXT_CHAR_CAP));
}
