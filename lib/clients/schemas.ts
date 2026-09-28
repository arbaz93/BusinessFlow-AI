import { z } from "zod";

export const clientStatusValues = ["ACTIVE", "INACTIVE"] as const;
export const clientStatusSchema = z.enum(clientStatusValues);

export const clientInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100, "Name must be 100 characters or fewer."),
  company: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : typeof value === "string" ? value.trim() : value,
    z.string().max(120, "Company must be 120 characters or fewer.").optional(),
  ),
  email: z.string().trim().min(1, "Email is required.").max(254, "Email must be 254 characters or fewer.").toLowerCase().pipe(z.email("Enter a valid email address.")),
  phone: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : typeof value === "string" ? value.trim() : value,
    z.string().max(40, "Phone must be 40 characters or fewer.").optional(),
  ),
  status: z.preprocess(
    (value) => value === null || value === undefined || value === "" ? "ACTIVE" : value,
    z.enum(clientStatusValues),
  ),
  notes: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : typeof value === "string" ? value.trim() : value,
    z.string().max(5000, "Notes must be 5,000 characters or fewer.").optional(),
  ),
});

export const clientIdSchema = z.string().trim().min(1).max(64);

export type ClientInput = z.infer<typeof clientInputSchema>;
export type ClientFormState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof ClientInput, string[]>>;
  success?: boolean;
};