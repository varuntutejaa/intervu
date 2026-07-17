import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required.").email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    fullName: z.string().min(1, "Full name is required."),
    email: z.string().min(1, "Email is required.").email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });
export type SignupFormValues = z.infer<typeof signupSchema>;

export const confirmCodeSchema = z.object({
  code: z.string().min(1, "Verification code is required."),
});
export type ConfirmCodeFormValues = z.infer<typeof confirmCodeSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required.").email("Enter a valid email address."),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
