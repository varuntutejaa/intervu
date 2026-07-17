import { z } from "zod";
import { MAX_RESUME_BYTES } from "../../lib/files";
import type { ParsedResumeFields } from "./api";

const optionalUrl = z
  .string()
  .refine((v) => !v || /^https?:\/\/.+/.test(v), "Enter a valid URL starting with http(s)://");

const optionalPhone = z
  .string()
  .refine((v) => !v || /^[\d\s()+-]{7,}$/.test(v), "Enter a valid phone number.");

export const CURRENT_STATUS_OPTIONS = [
  { value: "Student", label: "Student" },
  { value: "Employed", label: "Employed" },
  { value: "Open to Work", label: "Open to Work" },
];

export const candidateProfileSchema = z.object({
  // Basic information
  fullName: z.string(),
  phoneNumber: optionalPhone,
  location: z.string(),
  // Professional information
  desiredRole: z.string(),
  experience: z.string(),
  currentStatus: z.string(),
  bio: z.string(),
  // Skills
  technicalSkills: z.array(z.string()),
  softSkills: z.array(z.string()),
  // Links
  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
  portfolioUrl: optionalUrl,
  // Resume
  resume: z
    .instanceof(File)
    .nullable()
    .refine((f) => !f || f.size <= MAX_RESUME_BYTES, "Please choose a resume under 4MB."),
});
export type CandidateProfileFormValues = z.infer<typeof candidateProfileSchema>;

export const recruiterProfileSchema = z.object({
  companyName: z.string(),
  jobTitle: z.string(),
  companyWebsite: optionalUrl,
  companySize: z.string(),
  industry: z.string(),
  companyBio: z.string(),
  companyLogo: z.instanceof(File).nullable(),
});
export type RecruiterProfileFormValues = z.infer<typeof recruiterProfileSchema>;

export const EMPTY_CANDIDATE_VALUES: CandidateProfileFormValues = {
  fullName: "",
  phoneNumber: "",
  location: "",
  desiredRole: "",
  experience: "",
  currentStatus: "",
  bio: "",
  technicalSkills: [],
  softSkills: [],
  linkedinUrl: "",
  githubUrl: "",
  portfolioUrl: "",
  resume: null,
};

export const EMPTY_RECRUITER_VALUES: RecruiterProfileFormValues = {
  companyName: "",
  jobTitle: "",
  companyWebsite: "",
  companySize: "",
  industry: "",
  companyBio: "",
  companyLogo: null,
};

// Fills in gaps from a parsed resume without clobbering anything the
// candidate already typed by hand — a parsed field only wins when it's
// actually non-empty.
export function mergeParsedResumeFields(
  current: CandidateProfileFormValues,
  parsed: ParsedResumeFields,
): CandidateProfileFormValues {
  return {
    ...current,
    fullName: parsed.fullName || current.fullName,
    phoneNumber: parsed.phoneNumber || current.phoneNumber,
    location: parsed.location || current.location,
    desiredRole: parsed.desiredRole || current.desiredRole,
    experience: parsed.experience || current.experience,
    bio: parsed.bio || current.bio,
    technicalSkills: parsed.technicalSkills.length > 0 ? parsed.technicalSkills : current.technicalSkills,
    softSkills: parsed.softSkills.length > 0 ? parsed.softSkills : current.softSkills,
    linkedinUrl: parsed.linkedinUrl || current.linkedinUrl,
    githubUrl: parsed.githubUrl || current.githubUrl,
    portfolioUrl: parsed.portfolioUrl || current.portfolioUrl,
  };
}
