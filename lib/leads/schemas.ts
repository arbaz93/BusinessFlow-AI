import { z } from "zod";

function optionalText(maximum: number) {
  return z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : typeof value === "string" ? value.trim() : value,
    z.string().max(maximum).optional(),
  );
}

export const leadInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100, "Name must be 100 characters or fewer."),
  email: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : typeof value === "string" ? value.trim() : value,
    z.email("Enter a valid email address.").max(254).optional(),
  ),
  phone: optionalText(40),
  company: optionalText(120),
  source: optionalText(80),
  notes: optionalText(2000),
});

export const leadStatusSchema = z.enum(["NEW", "CONTACTED", "QUALIFIED", "LOST"]);

export type LeadInput = z.infer<typeof leadInputSchema>;
export type LeadFormState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof LeadInput, string[]>>;
  success?: boolean;
};