/**
 * Standalone environment guard for seed scripts.
 *
 * This module is intentionally free of any Prisma or database imports so it
 * can be loaded before any database connection is attempted. It checks the
 * environment and exits before any sensitive imports are resolved.
 *
 * Usage at the TOP of any seed/reset script (before other imports):
 *
 *   import "./seed/pre-check";  // exits process if production
 */

const SEED_FORBIDDEN_EXIT = 1;

function getDatabaseHost(connectionString: string | undefined): string | null {
  if (!connectionString) return null;
  try {
    const url = new URL(connectionString);
    return url.hostname;
  } catch {
    return null;
  }
}

function isLocalDatabase(connectionString: string | undefined): boolean {
  if (!connectionString) return true;
  const host = getDatabaseHost(connectionString);
  if (!host) return true;
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
}

function isVercel(): boolean {
  return process.env.VERCEL === "1" || process.env.VERCEL === "true";
}

function isSeedExplicitlyEnabled(): boolean {
  return process.env.SEED_DATA_ENABLED === "true";
}

function isSeedEnvironmentAllowed(): boolean {
  const nodeEnv = process.env.NODE_ENV ?? "development";

  if (nodeEnv === "test") return true;
  if (nodeEnv === "production") return false;
  if (nodeEnv !== "development") return false;

  if (isVercel()) {
    return false;
  }

  const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;

  if (!connectionString) {
    return true;
  }

  if (isLocalDatabase(connectionString)) return true;

  return isSeedExplicitlyEnabled();
}

if (!isSeedEnvironmentAllowed()) {
  console.error("Seed data is disabled in production.");
  process.exit(SEED_FORBIDDEN_EXIT);
}
