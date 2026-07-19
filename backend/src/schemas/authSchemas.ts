import { z } from "zod";

export const roleSchema = z.enum(["candidate", "recruiter"]);

export const signupSchema = z.object({
  email: z.string().trim().min(1, "Email and password are required."),
  password: z.string().min(1, "Email and password are required."),
  name: z.string().optional(),
});

export const confirmSchema = z.object({
  email: z.string().trim().min(1, "Email and code are required."),
  code: z.string().min(1, "Email and code are required."),
});

export const resendCodeSchema = z.object({
  email: z.string().trim().min(1, "Email is required."),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email and password are required."),
  password: z.string().min(1, "Email and password are required."),
  role: roleSchema.optional(),
});

export const switchRoleSchema = z.object({
  role: roleSchema,
});
