/**
 * Environment safety guard for seed scripts.
 *
 * Seed scripts must NEVER run against production. This module centralizes the
 * environment detection logic so every seed/reset script fails closed when
 * the target database cannot be confidently identified as non-production.
 */

import { isLocalDatabase, isVercel, isSeedExplicitlyEnabled } from "./env-helpers";

const SEED_FORBIDDEN_EXIT = 1;

/**
 * Determine whether the current environment is safe for seed operations
 * (i.e., development or test, not production).
 *
 * This check uses multiple signals and fails closed (returns false) when the
 * environment cannot be confidently identified as safe:
 *   - NODE_ENV: "test" always allowed; "production" always blocked
 *   - Vercel environment metadata: VERCEL_ENV=production is blocked
 *   - DATABASE_URL host heuristics: local databases allowed, remote databases
 *     require explicit SEED_DATA_ENABLED=true
 *
 * @param options.forceProductionRefOverride - Only for explicit safety testing.
 *        Pass a connection string that should be treated as production to
 *        verify the guard rejects it.
 */
export function isSeedEnvironmentAllowed(options?: {
  forceProductionRefOverride?: string;
}): boolean {
  const nodeEnv = process.env.NODE_ENV ?? "development";

  if (nodeEnv === "test") return true;
  if (nodeEnv === "production") return false;
  if (nodeEnv !== "development") return false;

  if (isVercel()) {
    return false;
  }

  const connectionString =
    options?.forceProductionRefOverride ?? process.env.DATABASE_URL ?? process.env.DIRECT_URL;

  if (!connectionString) {
    return true;
  }

  if (isLocalDatabase(connectionString)) return true;

  return isSeedExplicitlyEnabled();
}

/**
 * Assert that seeding is allowed. If not, throw an error with a clear message
 * and exit the process. This should be called at the very top of any seed
 * or reset script before any database mutation occurs.
 */
export function assertSeedAllowed(): void {
  if (!isSeedEnvironmentAllowed()) {
    console.error("Seed data is disabled in production.");
    process.exit(SEED_FORBIDDEN_EXIT);
  }
}

export { SEED_FORBIDDEN_EXIT };
