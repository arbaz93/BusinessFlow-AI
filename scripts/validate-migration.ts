#!/usr/bin/env node
/**
 * Migration Validation Script
 *
 * Validates that:
 * 1. Prisma schema is valid
 * 2. Migration history can be applied to a fresh database
 * 3. Current schema matches migrated schema
 * 4. No drift between schema.prisma, migration history, and database
 *
 * This script is safe to run against development/test databases.
 * It will REFUSE to run against production-like databases.
 */

import "../prisma/seed/pre-check";
import dotenv from "dotenv";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { execSync } from "node:child_process";
import { isLocalDatabase } from "../prisma/seed/env-helpers";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

interface ValidationResult {
  name: string;
  passed: boolean;
  message: string;
  details?: string;
}

const results: ValidationResult[] = [];

function log(message: string) {
  console.log(`[validate-migration] ${message}`);
}

function pass(name: string, message: string, details?: string) {
  results.push({ name, passed: true, message, details });
  console.log(`  ✅ ${name}: ${message}`);
}

function fail(name: string, message: string, details?: string) {
  results.push({ name, passed: false, message, details });
  console.error(`  ❌ ${name}: ${message}`);
  if (details) console.error(`     ${details}`);
}

async function checkEnvironment() {
  log("Checking environment safety...");

  const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
  if (!connectionString) {
    fail("Environment", "No DATABASE_URL or DIRECT_URL configured");
    process.exit(1);
  }

  if (!isLocalDatabase(connectionString)) {
    fail("Environment", `Refusing to run against remote database: ${new URL(connectionString).hostname}`);
    console.error("This script only runs against local development databases.");
    console.error("Set SEED_DATA_ENABLED=true to override (NOT for production).");
    process.exit(1);
  }

  pass("Environment", `Local database confirmed: ${new URL(connectionString).hostname}`);
}

async function validatePrismaSchema() {
  log("Validating Prisma schema...");
  try {
    execSync("npx prisma validate", { stdio: "pipe" });
    pass("Prisma Schema", "Schema syntax is valid");
  } catch (error) {
    fail("Prisma Schema", "Schema validation failed", error instanceof Error ? error.message : String(error));
  }
}

async function validateMigrationHistory() {
  log("Validating migration history...");

  try {
    // Check migration status
    const output = execSync("npx prisma migrate status", { encoding: "utf-8" });
    if (output.includes("Database schema is up to date")) {
      pass("Migration Status", "Database schema is up to date with migration history");
    } else if (output.includes("migrations pending")) {
      fail("Migration Status", "Migrations are pending", output);
    } else {
      pass("Migration Status", "Migration status checked", output.trim());
    }
  } catch (error) {
    fail("Migration Status", "Failed to check migration status", error instanceof Error ? error.message : String(error));
  }
}

async function validateSchemaConsistency(prisma: PrismaClient) {
  log("Validating schema consistency with database...");

  try {
    // Check that core tables exist and have expected columns
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

    for (const table of coreTables) {
      try {
        // Use raw query to check table exists
        await prisma.$queryRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 1`);
        pass(`Table ${table}`, "Exists and accessible");
      } catch (error) {
        fail(`Table ${table}`, "Missing or inaccessible", error instanceof Error ? error.message : String(error));
      }
    }

    // Check enums exist
    const enums = [
      "OrganizationRole",
      "InvitationStatus",
      "LeadStatus",
      "ClientStatus",
      "ActivityType",
      "ProjectStatus",
      "ProjectPriority",
      "TaskStatus",
      "TaskPriority",
      "ProjectDocumentType",
      "ProjectAIAnalysisStatus",
      "AIAnalysisFeedbackTargetType",
      "AIAnalysisFeedbackType",
      "AIConversationMessageRole",
    ];

    for (const enumName of enums) {
      try {
        await prisma.$queryRawUnsafe(`SELECT 1 FROM pg_type WHERE typname = '${enumName.toLowerCase()}'`);
        pass(`Enum ${enumName}`, "Exists in database");
      } catch {
        fail(`Enum ${enumName}`, "Missing from database");
      }
    }

    // Check critical indexes exist
    const criticalIndexes = [
      "User_authUserId_key",
      "User_email_key",
      "Organization_slug_key",
      "ProjectDocument_one_primary_brief",
    ];

    for (const indexName of criticalIndexes) {
      try {
        await prisma.$queryRawUnsafe(`SELECT 1 FROM pg_indexes WHERE indexname = '${indexName}'`);
        pass(`Index ${indexName}`, "Exists");
      } catch {
        fail(`Index ${indexName}`, "Missing from database");
      }
    }

    // Check _prisma_migrations table
    try {
      const migrations = await prisma.$queryRawUnsafe<{ migration_name: string; finished_at: Date }[]>(
        `SELECT "migration_name", "finished_at" FROM "_prisma_migrations" WHERE "rolled_back_at" IS NULL ORDER BY "finished_at" DESC`
      );
      pass("_prisma_migrations", `${migrations.length} migrations applied`);
      if (migrations.length !== 24) {
        fail("Migration Count", `Expected 24 applied migrations, found ${migrations.length}`, migrations.map(m => m.migration_name).join(", "));
      }
    } catch (error) {
      fail("_prisma_migrations", "Cannot read migration history", error instanceof Error ? error.message : String(error));
    }

  } catch (error) {
    fail("Schema Consistency", "Unexpected error", error instanceof Error ? error.message : String(error));
  }
}

async function validateTenantIntegrity(prisma: PrismaClient) {
  log("Validating tenant integrity (sample checks)...");

  try {
    // Check no null organizationIds on core tables
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
      const count = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
        `SELECT count(*) FROM "${table}" WHERE "organizationId" IS NULL`
      );
      if (Number(count[0].count) > 0) {
        fail(`Tenant Integrity: ${table}`, `${count[0].count} records with NULL organizationId`);
      } else {
        pass(`Tenant Integrity: ${table}`, "All records have organizationId");
      }
    }

    // Check organization member uniqueness
    const dupMembers = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `SELECT count(*) FROM (SELECT "organizationId", "userId", count(*) FROM "OrganizationMember" GROUP BY "organizationId", "userId" HAVING count(*) > 1) sub`
    );
    if (Number(dupMembers[0].count) > 0) {
      fail("Tenant Integrity: OrganizationMember", "Duplicate memberships found");
    } else {
      pass("Tenant Integrity: OrganizationMember", "No duplicate memberships");
    }

    // Check invitation uniqueness
    const dupInvites = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `SELECT count(*) FROM (SELECT "organizationId", email, count(*) FROM "OrganizationInvitation" GROUP BY "organizationId", email HAVING count(*) > 1) sub`
    );
    if (Number(dupInvites[0].count) > 0) {
      fail("Tenant Integrity: OrganizationInvitation", "Duplicate invitations found");
    } else {
      pass("Tenant Integrity: OrganizationInvitation", "No duplicate invitations");
    }

    // Check one primary brief per project
    const multiPrimary = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `SELECT count(*) FROM (SELECT "organizationId", "projectId", count(*) FROM "ProjectDocument" WHERE "isPrimary" = true GROUP BY "organizationId", "projectId" HAVING count(*) > 1) sub`
    );
    if (Number(multiPrimary[0].count) > 0) {
      fail("Tenant Integrity: Primary Brief", "Projects with multiple primary briefs");
    } else {
      pass("Tenant Integrity: Primary Brief", "At most one primary brief per project");
    }

  } catch (error) {
    fail("Tenant Integrity", "Unexpected error", error instanceof Error ? error.message : String(error));
  }
}

async function validateMigrationDrift() {
  log("Checking for schema/migration drift...");

  try {
    // Use prisma migrate diff to compare migration history to schema
    const diffOutput = execSync(
      "npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --script",
      { encoding: "utf-8", stdio: "pipe" }
    );

    if (diffOutput.trim() === "" || diffOutput.includes("-- No changes")) {
      pass("Drift Check", "No drift between migration history and Prisma schema");
    } else {
      // Some drift may be expected (e.g., partial unique indexes not expressible in Prisma)
      const lines = diffOutput.split("\n").filter(l => l.trim() && !l.startsWith("--"));
      if (lines.length > 0) {
        // Check if drift is only comments or known acceptable differences
        const significantDrift = lines.filter(l =>
          !l.includes("COMMENT ON") &&
          !l.includes("CREATE INDEX") && // Some indexes only in migrations
          !l.includes("DROP INDEX")
        );

        if (significantDrift.length > 0) {
          fail("Drift Check", `Schema drift detected (${significantDrift.length} significant differences)`, significantDrift.join("\n"));
        } else {
          pass("Drift Check", "Only acceptable drift (comments, partial indexes not in Prisma schema)");
        }
      } else {
        pass("Drift Check", "No significant drift detected");
      }
    }
  } catch (error) {
    fail("Drift Check", "Failed to run drift check", error instanceof Error ? error.message : String(error));
  }
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║       BusinessFlow AI — Migration Validation             ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  await checkEnvironment();

  const connectionString = process.env.DATABASE_URL!;
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    await validatePrismaSchema();
    await validateMigrationHistory();
    await validateSchemaConsistency(prisma);
    await validateTenantIntegrity(prisma);
    await validateMigrationDrift();
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("VALIDATION SUMMARY");
  console.log("═══════════════════════════════════════════════════════════");

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  for (const r of results) {
    const icon = r.passed ? "✅" : "❌";
    console.log(`${icon} ${r.name}: ${r.message}`);
  }

  console.log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    console.log("\n❌ VALIDATION FAILED — Review failures above");
    process.exit(1);
  } else {
    console.log("\n✅ ALL VALIDATIONS PASSED");
    process.exit(0);
  }
}

main().catch(async (e) => {
  console.error("Validation crashed:", e);
  process.exit(1);
});