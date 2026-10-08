import { z } from "zod";

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url().optional(),
);

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const requiredUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url({ message: "Must be a valid URL" }),
);

const requiredString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1, { message: "Must not be empty" }),
);

const isProduction = process.env.NODE_ENV === "production";
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";
const isVercelProduction = process.env.VERCEL_ENV === "production";

const isProductionLike = isProduction || isVercelProduction;

const requiredInProduction = <T extends z.ZodTypeAny>(schema: T) =>
  isProductionLike ? schema : schema.optional();

const requiredForFeature = <T extends z.ZodTypeAny>(schema: T, featureEnabled: boolean) =>
  featureEnabled ? schema : schema.optional();

const hasSupabaseConfig = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

const hasGeminiConfig = Boolean(process.env.GEMINI_API_KEY);

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: requiredInProduction(requiredUrl),
  NEXT_PUBLIC_SUPABASE_URL: requiredInProduction(requiredUrl),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: requiredInProduction(requiredString),
});

const serverEnvSchema = z.object({
  DATABASE_URL: requiredInProduction(requiredUrl),
  DIRECT_URL: optionalUrl,
  SUPABASE_SERVICE_ROLE_KEY: requiredInProduction(requiredString),
  GEMINI_API_KEY: requiredForFeature(requiredString, hasGeminiConfig || isProductionLike),
  GEMINI_MODEL: optionalString.default("gemini-2.5-flash"),
  AI_PROVIDER: z.enum(["gemini"]).default("gemini"),
  WORKSPACE_INVITATION_EXPIRY_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  SEED_DATA_ENABLED: z.preprocess(
    (value) => value === "true",
    z.boolean().default(false),
  ),
});

type PublicEnv = {
  NEXT_PUBLIC_SITE_URL: string | undefined;
  NEXT_PUBLIC_SUPABASE_URL: string | undefined;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string | undefined;
};

type ServerEnv = {
  DATABASE_URL: string | undefined;
  DIRECT_URL?: string | undefined;
  SUPABASE_SERVICE_ROLE_KEY: string | undefined;
  GEMINI_API_KEY: string | undefined;
  GEMINI_MODEL: string;
  AI_PROVIDER: "gemini";
  WORKSPACE_INVITATION_EXPIRY_DAYS: number;
  SEED_DATA_ENABLED: boolean;
};

const rawPublicEnv: PublicEnv = {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
};

const rawServerEnv: ServerEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  AI_PROVIDER: "gemini",
  WORKSPACE_INVITATION_EXPIRY_DAYS: process.env.WORKSPACE_INVITATION_EXPIRY_DAYS ? parseInt(process.env.WORKSPACE_INVITATION_EXPIRY_DAYS, 10) : 7,
  SEED_DATA_ENABLED: process.env.SEED_DATA_ENABLED === "true",
};

let validatedPublicEnv: PublicEnv;
let validatedServerEnv: ServerEnv;

try {
  validatedPublicEnv = publicEnvSchema.parse(rawPublicEnv);
} catch (error) {
  if (error instanceof z.ZodError) {
    const messages = error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Public environment validation failed: ${messages}`);
  }
  throw error;
}

try {
  validatedServerEnv = serverEnvSchema.parse(rawServerEnv);
} catch (error) {
  if (error instanceof z.ZodError) {
    const messages = error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Server environment validation failed: ${messages}`);
  }
  throw error;
}

export const env: PublicEnv & ServerEnv = {
  ...validatedPublicEnv,
  ...validatedServerEnv,
};

export function isPublicEnv(key: string): key is keyof PublicEnv {
  return key.startsWith("NEXT_PUBLIC_");
}

export function getPublicEnv(): PublicEnv {
  return validatedPublicEnv;
}

export function getServerEnv(): ServerEnv {
  return validatedServerEnv;
}

export function assertProductionReady() {
  if (!isProductionLike) return;

  const missing: string[] = [];

  if (!validatedPublicEnv.NEXT_PUBLIC_SITE_URL) missing.push("NEXT_PUBLIC_SITE_URL");
  if (!validatedPublicEnv.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!validatedPublicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (!validatedServerEnv.DATABASE_URL) missing.push("DATABASE_URL");
  if (!validatedServerEnv.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missing.length > 0) {
    throw new Error(
      `Production deployment missing required environment variables: ${missing.join(", ")}. ` +
        `Configure them in Vercel Project Settings → Environment Variables.`,
    );
  }
}

export function assertAiConfigured() {
  if (!validatedServerEnv.GEMINI_API_KEY) {
    throw new Error("AI features require GEMINI_API_KEY to be configured in the server environment.");
  }
  if (!/^gemini-[A-Za-z0-9.-]+$/.test(validatedServerEnv.GEMINI_MODEL)) {
    throw new Error(`Invalid GEMINI_MODEL: ${validatedServerEnv.GEMINI_MODEL}. Expected format: gemini-<model-name>`);
  }
}