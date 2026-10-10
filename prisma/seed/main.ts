import "./pre-check";
import dotenv from "dotenv";
import { PrismaClient } from "../../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedDemoWorkspace, getDemoUserCredentials, DEMO_AUTH_USER_IDS } from "./factories";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding development database with BusinessFlow demo data...\n");

  const { organizationId, ownerUserId, memberUserId } = await seedDemoWorkspace(prisma);

  const credentials = getDemoUserCredentials();
  console.log("\nSeed complete.");
  console.log(`Demo workspace ID: ${organizationId}`);
  console.log(`Demo owner user ID: ${ownerUserId}`);
  console.log(`Demo member user ID: ${memberUserId}`);
  console.log(`Demo owner: ${credentials.email} (${credentials.password})`);
  console.log(`Demo member: demo-member@example.test (DemoPass123!)`);
  console.log("\nNOTE: Demo Supabase Auth users must be created manually in the Supabase Dashboard.");
  console.log("Use these auth user IDs:");
  console.log(`  Owner authUserId: ${DEMO_AUTH_USER_IDS.owner}`);
  console.log(`  Member authUserId: ${DEMO_AUTH_USER_IDS.member}`);
  console.log("Then sign in with the email/password above to use the demo workspace.\n");
}

main()
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
