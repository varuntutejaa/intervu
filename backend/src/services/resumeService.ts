import type { Request } from "express";
import { getGroqClient } from "../lib/groq.js";
import { badGateway, unauthorized, unprocessable } from "../lib/httpError.js";
import { extractPdfText } from "../lib/pdfText.js";
import { getAuthUser } from "../middleware/auth.js";
import { ragConfig } from "../rag/config.js";
import { parseResumeSchema } from "../schemas/resumeSchemas.js";

const VALID_EXPERIENCE = new Set(["0-1", "1-3", "3-5", "5-10", "10+"]);

const EXTRACTION_SYSTEM_PROMPT = `You extract structured candidate profile fields from resume text.

Respond with ONLY a JSON object with exactly these keys:
fullName, phoneNumber, location, desiredRole, experience, technicalSkills, softSkills, linkedinUrl, githubUrl, portfolioUrl, bio

Rules:
- experience must be your best estimate of total years of professional experience, as one of exactly: "0-1", "1-3", "3-5", "5-10", "10+".
- technicalSkills and softSkills are arrays of short strings (e.g. ["Node.js", "PostgreSQL"]).
- bio is a 2-3 sentence professional summary written in first person, based only on what's in the resume.
- desiredRole is the candidate's most recent or most senior job title / target role.
- Never invent information that isn't present in the resume — leave a field as "" (or [] for arrays) if it isn't there.`;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

// Resumes are typically printed with URLs like "linkedin.com/in/x" (no
// protocol) — the frontend's URL fields require "https://", so normalize
// here rather than surfacing a validation error on a field the user never
// actually typed.
function asUrl(value: unknown): string {
  const s = asString(value).trim();
  if (!s) return "";
  return /^https?:\/\//.test(s) ? s : `https://${s}`;
}

function sanitizeParsedFields(raw: unknown) {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const experience = asString(r.experience);
  return {
    fullName: asString(r.fullName),
    phoneNumber: asString(r.phoneNumber),
    location: asString(r.location),
    desiredRole: asString(r.desiredRole),
    experience: VALID_EXPERIENCE.has(experience) ? experience : "",
    technicalSkills: asStringArray(r.technicalSkills),
    softSkills: asStringArray(r.softSkills),
    linkedinUrl: asUrl(r.linkedinUrl),
    githubUrl: asUrl(r.githubUrl),
    portfolioUrl: asUrl(r.portfolioUrl),
    bio: asString(r.bio),
  };
}

export async function parseResume(req: Request, rawInput: unknown) {
  // Any authenticated user, not requireRole("candidate") — this must work
  // during initial profile setup too, before a candidate row exists yet.
  if (!getAuthUser(req)) throw unauthorized();

  const { resumeData } = parseResumeSchema.parse(rawInput);
  const text = await extractPdfText(resumeData);
  if (!text) throw unprocessable("Couldn't read any text from that file.");

  const groq = getGroqClient();
  const completion = await groq.chat.completions.create({
    model: ragConfig.chatModel,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      // Resumes run long; cap well under the model's context window.
      { role: "user", content: text.slice(0, 12000) },
    ],
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
  } catch {
    throw badGateway("Couldn't parse that resume. Try again.");
  }

  return { fields: sanitizeParsedFields(parsed) };
}
