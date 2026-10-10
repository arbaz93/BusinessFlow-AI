import "server-only";

import { z } from "zod";

const demoModeSchema = z.preprocess(
  (value) => value === "true",
  z.boolean().default(false),
);

export const DEMO_MODE_ENABLED: boolean = demoModeSchema.parse(process.env.DEMO_MODE_ENABLED);

export const DEMO_OWNER_AUTH_USER_ID = "demo_owner_auth_uid";
export const DEMO_MEMBER_AUTH_USER_ID = "demo_member_auth_uid";

export const DEMO_ORGANIZATION_SLUG = "demo-workspace";
export const DEMO_ORGANIZATION_NAME = "Demo Workspace";
export const DEMO_BUSINESS_TYPE = "OTHER" as const;

export const DEMO_OWNER_EMAIL = "demo-owner@example.test";
export const DEMO_OWNER_PASSWORD = "DemoPass123!";
export const DEMO_OWNER_NAME = "Demo Owner";

export const DEMO_MEMBER_EMAIL = "demo-member@example.test";
export const DEMO_MEMBER_PASSWORD = "DemoPass123!";
export const DEMO_MEMBER_NAME = "Demo Member";

export const DEMO_USER_EMAILS = [DEMO_OWNER_EMAIL, DEMO_MEMBER_EMAIL];

export function getDemoOwnerCredentials() {
  return {
    email: DEMO_OWNER_EMAIL,
    password: DEMO_OWNER_PASSWORD,
    name: DEMO_OWNER_NAME,
    authUserId: DEMO_OWNER_AUTH_USER_ID,
  };
}

export function isDemoEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return DEMO_USER_EMAILS.some((demoEmail) => demoEmail === normalized);
}

export function isDemoModeEnabled(): boolean {
  return DEMO_MODE_ENABLED;
}
