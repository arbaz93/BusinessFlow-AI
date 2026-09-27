import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address.").trim(),
  password: z.string().min(1, "Enter your password."),
});

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name.").max(100),
    email: z.email("Enter a valid email address.").trim(),
    password: z.string().min(8, "Use at least 8 characters for your password."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Your passwords do not match.",
    path: ["confirmPassword"],
  });

export const workspaceSchema = z.object({
  name: z.string().trim().min(2, "Workspace name must be at least 2 characters.").max(80, "Workspace name must be 80 characters or fewer."),
});