/**
 * Database Health Check Utility
 *
 * Provides a lightweight health check for the database that can be used:
 * - As a standalone script (npm run db:health)
 * - As an imported function for internal monitoring
 * - In smoke checks after deployment/recovery
 *
 * Does NOT expose sensitive information or raw database URLs.
 */

import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export interface HealthCheckResult {
  healthy: boolean;
  checks: HealthCheck[];
  timestamp: string;
  durationMs: number;
}

export interface HealthCheck {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
  details?: Record<string, unknown>;
}

export interface HealthCheckOptions {
  /** Prisma client to use (creates new if not provided) */
  prisma?: PrismaClient;
  /** Connection string (uses env if not provided) */
  connectionString?: string;
  /** Timeout for individual checks in ms */
  timeoutMs?: number;
}

/**
 * Runs a comprehensive database health check.
 * Safe to run in production - does not modify data.
 */
export async function runDatabaseHealthCheck(options: HealthCheckOptions = {}): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const checks: HealthCheck[] = [];
  let prisma: PrismaClient | null = null;
  let shouldDisconnect = false;

  try {
    // Get or create Prisma client
    if (options.prisma) {
      prisma = options.prisma;
    } else {
      const connectionString = options.connectionString ?? process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error("DATABASE_URL not configured");
      }
      const adapter = new PrismaPg({ connectionString });
      prisma = new PrismaClient({ adapter });
      shouldDisconnect = true;
    }

    // Run all checks with timeout protection
    await runWithTimeout(checkConnectivity(prisma), options.timeoutMs ?? 5000, checks, "Connectivity");
    await runWithTimeout(checkMigrationStatus(prisma), options.timeoutMs ?? 5000, checks, "Migration Status");
    await runWithTimeout(checkCoreTables(prisma), options.timeoutMs ?? 5000, checks, "Core Tables");
    await runWithTimeout(checkTenantIntegrity(prisma), options.timeoutMs ?? 5000, checks, "Tenant Integrity");
    await runWithTimeout(checkPrismaCompatibility(prisma), options.timeoutMs ?? 5000, checks, "Prisma Compatibility");

  } catch (error) {
    checks.push({
      name: "Health Check Execution",
      status: "fail",
      message: `Health check crashed: ${error instanceof Error ? error.message : String(error)}`,
    });
  } finally {
    if (shouldDisconnect && prisma) {
      await prisma.$disconnect();
    }
  }

  const healthy = checks.every(c => c.status === "pass" || c.status === "warn");

  return {
    healthy,
    checks,
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - startTime,
  };
}

async function runWithTimeout(
  promise: Promise<HealthCheck>,
  timeoutMs: number,
  checks: HealthCheck[],
  name: string
) {
  try {
    const result = await Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
    checks.push(result);
  } catch (error) {
    checks.push({
      name,
      status: "fail",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Check basic database connectivity
 */
async function checkConnectivity(prisma: PrismaClient): Promise<HealthCheck> {
  try {
    await prisma.$queryRaw`SELECT 1 as health_check`;
    return {
      name: "Connectivity",
      status: "pass",
      message: "Database connection successful",
    };
  } catch (error) {
    return {
      name: "Connectivity",
      status: "fail",
      message: `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Check that all migrations are applied
 */
async function checkMigrationStatus(prisma: PrismaClient): Promise<HealthCheck> {
  try {
    const migrations = await prisma.$queryRaw<{ migration_name: string; finished_at: Date; rolled_back_at: Date | null; logs: string | null }[]>`
      SELECT "migration_name", "finished_at", "rolled_back_at", "logs"
      FROM "_prisma_migrations"
      ORDER BY "finished_at" DESC
    `;

    const applied = migrations.filter(m => m.rolled_back_at === null).length;
    const rolledBack = migrations.filter(m => m.rolled_back_at !== null).length;
    const total = migrations.length;

    // Expected count as of Step 34
    const expectedMigrations = 24;

    const rolledBackNames = migrations
      .filter(m => m.rolled_back_at !== null)
      .map(m => m.migration_name);

    // Current state is healthy if all expected migrations are applied
    // Historical rollbacks are informational only
    if (applied === expectedMigrations) {
      const status = rolledBack > 0 ? "warn" : "pass";
      const message = rolledBack > 0
        ? `All ${expectedMigrations} migrations applied (${rolledBack} historical rollback(s): ${rolledBackNames.join(", ")})`
        : `All ${expectedMigrations} migrations applied`;
      return {
        name: "Migration Status",
        status,
        message,
        details: { applied, rolledBack, total, expected: expectedMigrations, rolledBackNames },
      };
    } else if (applied < expectedMigrations) {
      return {
        name: "Migration Status",
        status: "fail",
        message: `Only ${applied}/${expectedMigrations} migrations applied`,
        details: { applied, rolledBack, total, expected: expectedMigrations, rolledBackNames },
      };
    } else {
      return {
        name: "Migration Status",
        status: "warn",
        message: `${applied} migrations applied (expected ${expectedMigrations})`,
        details: { applied, rolledBack, total, expected: expectedMigrations, rolledBackNames },
      };
    }
  } catch (error) {
    return {
      name: "Migration Status",
      status: "fail",
      message: `Failed to check migrations: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Check that core tables exist and are accessible
 */
async function checkCoreTables(prisma: PrismaClient): Promise<HealthCheck> {
  const coreTables = [
    "User",
    "Organization",
    "OrganizationMember",
    "OrganizationInvitation",
    "Lead",
    "Client",
    "Project",
    "Task",
    "ProjectDocument",
    "ProjectAIAnalysis",
    "AISuggestedTaskApproval",
    "AIAnalysisFeedback",
    "AIConversation",
    "AIConversationMessage",
    "AIAssistantTaskProposal",
    "Activity",
  ];

  const results: Array<{ table: string; exists: boolean; error?: string }> = [];

  for (const table of coreTables) {
    try {
      await prisma.$queryRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 1`);
      results.push({ table, exists: true });
    } catch (error) {
      results.push({ table, exists: false, error: error instanceof Error ? error.message : String(error) });
    }
  }

  const missing = results.filter(r => !r.exists);

  if (missing.length === 0) {
    return {
      name: "Core Tables",
      status: "pass",
      message: `All ${coreTables.length} core tables accessible`,
      details: { checked: coreTables.length },
    };
  } else {
    return {
      name: "Core Tables",
      status: "fail",
      message: `${missing.length} core table(s) missing or inaccessible`,
      details: { missing: missing.map(m => m.table), errors: missing.map(m => m.error) },
    };
  }
}

/**
 * Check tenant integrity (organization boundaries)
 */
async function checkTenantIntegrity(prisma: PrismaClient): Promise<HealthCheck> {
  try {
    const issues: string[] = [];

    // Check for NULL organizationId on key tables
    const tablesWithOrg = [
      "Lead",
      "Client",
      "Project",
      "Task",
      "ProjectDocument",
      "ProjectAIAnalysis",
      "AISuggestedTaskApproval",
      "AIAnalysisFeedback",
      "AIConversation",
      "AIAssistantTaskProposal",
      "Activity",
    ];

    for (const table of tablesWithOrg) {
      // Use queryRawUnsafe for dynamic table names (identifiers can't be parameterized)
      const result = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
        `SELECT count(*) FROM "${table}" WHERE "organizationId" IS NULL`
      );
      if (Number(result[0].count) > 0) {
        issues.push(`${table}: ${result[0].count} records with NULL organizationId`);
      }
    }

    // Check for orphaned ProjectDocuments (no parent Project)
    const orphanDocs = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT count(*) FROM "ProjectDocument" pd
      LEFT JOIN "Project" p ON p.id = pd."projectId" AND p."organizationId" = pd."organizationId"
      WHERE p.id IS NULL
    `;
    if (Number(orphanDocs[0].count) > 0) {
      issues.push(`ProjectDocument: ${orphanDocs[0].count} orphaned documents`);
    }

    // Check for orphaned Tasks (no parent Project)
    const orphanTasks = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT count(*) FROM "Task" t
      LEFT JOIN "Project" p ON p.id = t."projectId" AND p."organizationId" = t."organizationId"
      WHERE p.id IS NULL
    `;
    if (Number(orphanTasks[0].count) > 0) {
      issues.push(`Task: ${orphanTasks[0].count} orphaned tasks`);
    }

    if (issues.length === 0) {
      return {
        name: "Tenant Integrity",
        status: "pass",
        message: "Organization boundaries intact",
        details: { checks: tablesWithOrg.length + 2 },
      };
    } else {
      return {
        name: "Tenant Integrity",
        status: "fail",
        message: `${issues.length} tenant integrity issue(s)`,
        details: { issues },
      };
    }
  } catch (error) {
    return {
      name: "Tenant Integrity",
      status: "fail",
      message: `Tenant integrity check failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Check Prisma client compatibility (schema matches database)
 */
async function checkPrismaCompatibility(prisma: PrismaClient): Promise<HealthCheck> {
  try {
    // Try a simple query on each model to verify Prisma mapping works
    const testQueries = [
      () => prisma.user.findFirst({ select: { id: true } }),
      () => prisma.organization.findFirst({ select: { id: true } }),
      () => prisma.lead.findFirst({ select: { id: true } }),
      () => prisma.client.findFirst({ select: { id: true } }),
      () => prisma.project.findFirst({ select: { id: true } }),
      () => prisma.task.findFirst({ select: { id: true } }),
      () => prisma.projectDocument.findFirst({ select: { id: true } }),
      () => prisma.projectAIAnalysis.findFirst({ select: { id: true } }),
      () => prisma.aIConversation.findFirst({ select: { id: true } }),
      () => prisma.activity.findFirst({ select: { id: true } }),
    ];

    const failures: string[] = [];

    for (const query of testQueries) {
      try {
        await query();
      } catch (error) {
        failures.push(error instanceof Error ? error.message : String(error));
      }
    }

    if (failures.length === 0) {
      return {
        name: "Prisma Compatibility",
        status: "pass",
        message: "Prisma client maps correctly to database schema",
        details: { modelsTested: testQueries.length },
      };
    } else {
      return {
        name: "Prisma Compatibility",
        status: "fail",
        message: `${failures.length} model mapping failure(s)`,
        details: { failures },
      };
    }
  } catch (error) {
    return {
      name: "Prisma Compatibility",
      status: "fail",
      message: `Compatibility check failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Quick health check for use in application routes (lighter weight)
 */
export async function quickHealthCheck(prisma: PrismaClient): Promise<{ healthy: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { healthy: true, latencyMs: Date.now() - start };
  } catch {
    return { healthy: false, latencyMs: Date.now() - start };
  }
}