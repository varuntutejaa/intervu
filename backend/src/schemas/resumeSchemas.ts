import { z } from "zod";
import { resumeDataUrlSchema } from "./common.js";

export const parseResumeSchema = z.object({
  resumeData: resumeDataUrlSchema,
});
export type ParseResumeInput = z.infer<typeof parseResumeSchema>;

export const uploadResumeSchema = z.object({
  filename: z.string().trim().min(1, "filename is required."),
  data: resumeDataUrlSchema,
});
export type UploadResumeInput = z.infer<typeof uploadResumeSchema>;
