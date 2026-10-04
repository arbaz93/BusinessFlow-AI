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
  businessType: z.enum(["CREATIVE_AGENCY", "MARKETING_AGENCY", "DESIGN_STUDIO", "SOFTWARE_DEVELOPMENT", "CONSULTING", "OTHER"], "Select a business type."),
});

export const organizationUpdateSchema = workspaceSchema;

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(100, "Full name must be 100 characters or fewer."),
});

export const passwordUpdateSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(8, "Use at least 8 characters for your password."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Your passwords do not match.",
    path: ["confirmPassword"],
  });

export const deleteAccountSchema = z.object({
  confirmation: z
    .string()
    .transform((value) => value.trim().toUpperCase())
    .refine((value) => value === "DELETE ACCOUNT", "Type DELETE ACCOUNT to confirm."),
  password: z.string().min(1, "Enter your password to continue."),
});