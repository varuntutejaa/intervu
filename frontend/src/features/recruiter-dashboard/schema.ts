import { z } from "zod";

export const applicantFeedbackSchema = z.object({
  status: z.string().min(1),
  technicalRating: z.number().nullable(),
  communicationRating: z.number().nullable(),
  overallRating: z.number().nullable(),
  strengths: z.string(),
  weaknesses: z.string(),
  recommendation: z.string(),
});
export type ApplicantFeedbackFormValues = z.infer<typeof applicantFeedbackSchema>;
