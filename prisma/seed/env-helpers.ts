/**
 * Environment helpers for seed scripts.
 *
 * These helpers provide safe, server-side environment detection logic
 * used by seed and reset scripts. They are intentionally separate from
 * application code so that environment detection cannot be bypassed
 * through the normal application runtime.
 */

function getDatabaseHost(connectionString: string | undefined): string | null {
  if (!connectionString) return null;
  try {
    const url = new URL(connectionString);
    return url.hostname;
  } catch {
    return null;
  }
}

export function isLocalDatabase(connectionString: string | undefined): boolean {
  if (!connectionString) return true;
  const host = getDatabaseHost(connectionString);
  if (!host) return true;
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
}

export function isVercel() {
  return process.env.VERCEL === "1" || process.env.VERCEL === "true";
}

export function isVercelProduction() {
  return process.env.VERCEL_ENV === "production";
}

/**
 * Check if an explicit seed enablement flag is set.
 * This is required for remote databases that cannot be confidently
 * identified as non-production.
 */
export function isSeedExplicitlyEnabled(): boolean {
  return process.env.SEED_DATA_ENABLED === "true";
}

export { getDatabaseHost };
