import { z } from "zod";
import { currencyValues, leadSourceValues, leadStatusValues } from "@/lib/leads/options";

function optionalText(maximum: number) {
  return z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : typeof value === "string" ? value.trim() : value,
    z.string().max(maximum).optional(),
  );
}

export const leadInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100, "Name must be 100 characters or fewer."),
  company: optionalText(120),
  source: z.enum(leadSourceValues, "Choose a lead source."),
  email: z.string()
    .trim()
    .min(1, "Email is required.")
    .max(254, "Email must be 254 characters or fewer.")
    .toLowerCase()
    .pipe(z.email("Enter a valid email address.")),
  phone: optionalText(40),
  notes: optionalText(2000),
  status: z.preprocess(
    (value) => value === null || value === undefined || value === "" ? "NEW" : value,
    z.enum(leadStatusValues),
  ),
  estimatedValue: z.preprocess(
    (value) => {
      if (typeof value === "string" && value.trim() === "") return undefined;
      return typeof value === "string" ? Number(value) : value;
    },
    z.number()
      .finite("Enter a valid amount.")
      .min(0, "Estimated value cannot be negative.")
      .max(9_999_999_999.99, "Estimated value is too large.")
      .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8, "Use no more than two decimal places.")
      .optional(),
  ),
  currency: z.preprocess(
    (value) => value === null || value === undefined || value === "" ? "USD" : value,
    z.enum(currencyValues, "Choose a supported currency."),
  ),
});

export const leadEditableStatusSchema = z.enum(leadStatusValues);
export const leadIdSchema = z.string().trim().min(1).max(64);

export type LeadInput = z.infer<typeof leadInputSchema>;
export type LeadFormState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof LeadInput, string[]>>;
  success?: boolean;
};