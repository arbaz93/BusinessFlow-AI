/**
 * Development database reset script.
 *
 * This script is EXPLICITLY for development use only. It:
 * 1. Verifies the environment is safe (fails closed in production)
 * 2. Verifies the database target is local/development
 * 3. Deletes all data in dependency-correct order
 * 4. Re-runs the seed
 *
 * This is a DESTRUCTIVE operation. It will remove all data from the target
 * database. Never run this against production.
 */

import "./pre-check";
import dotenv from "dotenv";
import { PrismaClient } from "../../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { isSeedEnvironmentAllowed } from "./env-guard";
import { isLocalDatabase } from "./env-helpers";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  if (!isSeedEnvironmentAllowed()) {
    console.error("Reset is disabled in production.");
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not configured. Cannot verify database target.");
    process.exit(1);
  }

  if (!isLocalDatabase(connectionString)) {
    console.error(
      "Reset can only run against a local development database. " +
        "Refusing to reset a remote database.",
    );
    console.error(`Current target: ${new URL(connectionString).hostname}`);
    process.exit(1);
  }

  console.log("Resetting development database (this will delete all data)...");

  await prisma.$transaction(async (tx) => {
    await tx.activity.deleteMany();
    await tx.aIConversationMessage.deleteMany();
    await tx.aIConversation.deleteMany();
    await tx.aIAssistantTaskProposal.deleteMany();
    await tx.aIAnalysisFeedback.deleteMany();
    await tx.aISuggestedTaskApproval.deleteMany();
    await tx.projectAIAnalysis.deleteMany();
    await tx.projectDocument.deleteMany();
    await tx.task.deleteMany();
    await tx.project.deleteMany();
    await tx.client.deleteMany();
    await tx.lead.deleteMany();
    await tx.organizationInvitation.deleteMany();
    await tx.organizationMember.deleteMany();
    await tx.organization.deleteMany();
    await tx.user.deleteMany();
  });

  console.log("Database reset complete. Re-seeding...\n");

  const seedModule = await import("./main");
  await seedModule.runSeed(prisma);
}

main()
  .catch(async (e) => {
    console.error("Reset failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
