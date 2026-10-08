#!/usr/bin/env node
/**
 * Database Health Check Script
 *
 * Runs a comprehensive health check against the configured database.
 * Safe for production use - read-only operations only.
 *
 * Usage:
 *   npm run db:health
 *   node scripts/db-health.ts
 */

import dotenv from "dotenv";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { runDatabaseHealthCheck } from "../lib/db/health";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║       BusinessFlow AI — Database Health Check            ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL not configured");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const result = await runDatabaseHealthCheck({ prisma });

    console.log(`Timestamp: ${result.timestamp}`);
    console.log(`Duration: ${result.durationMs}ms`);
    console.log(`Overall: ${result.healthy ? "✅ HEALTHY" : "❌ UNHEALTHY"}\n`);

    for (const check of result.checks) {
      const icon = check.status === "pass" ? "✅" : check.status === "warn" ? "⚠️" : "❌";
      console.log(`${icon} ${check.name}: ${check.message}`);
      if (check.details) {
        console.log(`   Details: ${JSON.stringify(check.details, null, 2).replace(/\n/g, "\n   ")}`);
      }
    }

    console.log("\n═══════════════════════════════════════════════════════════");
    if (result.healthy) {
      console.log("✅ DATABASE HEALTHY");
      process.exit(0);
    } else {
      console.log("❌ DATABASE UNHEALTHY — Review failures above");
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(async (e) => {
  console.error("Health check crashed:", e);
  process.exit(1);
});