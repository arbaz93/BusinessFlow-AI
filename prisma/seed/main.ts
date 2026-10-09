import "./pre-check";
import dotenv from "dotenv";
import { PrismaClient } from "../../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  createDemoOrganization,
  createDemoUsers,
  createDemoLeads,
  createDemoClients,
  createDemoProjects,
  createDemoTasks,
  createDemoDocuments,
  createDemoAIAnalysis,
  createDemoAIAnalysisFeedback,
  createDemoActivity,
  createDemoAIConversation,
  getDemoUserCredentials,
} from "./factories";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export async function runSeed(prisma: PrismaClient) {
  console.log("Seeding development database with BusinessFlow demo data...\n");

  const org = await createDemoOrganization(prisma);
  console.log(`Created demo organization: ${org.name}`);

  const ownerAuthUserId = "demo_owner_auth_uid";
  const memberAuthUserId = "demo_member_auth_uid";

  const users = await createDemoUsers(prisma, org.id, ownerAuthUserId, memberAuthUserId);
  console.log(`Created demo users: ${users.owner.name}, ${users.member.name}`);

  const ctx = {
    organizationId: org.id,
    ownerUserId: users.owner.id,
    ownerAuthUserId,
    memberUserId: users.member.id,
    memberAuthUserId,
  };

  const leads = await createDemoLeads(prisma, ctx);
  console.log(`Created ${leads.length} demo leads`);

  const convertedLeadId = leads.find((l) => l.id === "demo_lead_qualified")!.id;
  const wonLeadId = leads.find((l) => l.id === "demo_lead_won")!.id;

  const clients = await createDemoClients(prisma, ctx, {
    convertedId: convertedLeadId,
    wonId: wonLeadId,
  });
  console.log(`Created ${clients.length} demo clients`);

  const clientIds = {
    convertedId: clients.find((c) => c.id === "demo_client_converted")!.id,
    wonId: clients.find((c) => c.id === "demo_client_won")!.id,
    inactiveId: clients.find((c) => c.id === "demo_client_inactive")!.id,
  };

  const projects = await createDemoProjects(prisma, ctx, clientIds);
  console.log(`Created ${projects.length} demo projects`);

  const websiteProject = projects.find((p) => p.name.includes("Website"));
  const mobileProject = projects.find((p) => p.name.includes("Mobile"));
  const brandProject = projects.find((p) => p.name.includes("Brand"));
  const ecommerceProject = projects.find((p) => p.name.includes("E-commerce"));
  const apiProject = projects.find((p) => p.name.includes("API"));

  if (!websiteProject || !mobileProject || !brandProject || !ecommerceProject || !apiProject) {
    throw new Error("Demo projects were not created with expected names");
  }

  const projectIds = {
    website: websiteProject.id,
    mobile: mobileProject.id,
    brand: brandProject.id,
    ecommerce: ecommerceProject.id,
    api: apiProject.id,
  };

  const tasks = await createDemoTasks(prisma, ctx, projectIds);
  console.log(`Created ${tasks.length} demo tasks`);

  const documents = await createDemoDocuments(prisma, ctx, projectIds);
  console.log(`Created ${documents.length} demo documents`);

  const briefDoc = documents.find((d) => d.name === "Demo Mobile App Brief");
  if (!briefDoc) throw new Error("Demo brief document was not created");

  const aiAnalysis = await createDemoAIAnalysis(
    prisma,
    ctx,
    projectIds.mobile,
    briefDoc.id,
    briefDoc.name,
    briefDoc.updatedAt,
    {
      summary:
        "Demo Mobile App Development is a cross-platform project to build a mobile operations management app. The project is currently in progress with a high-priority focus on offline capability and cross-platform compatibility.",
      requirements: [
        {
          title: "Cross-platform compatibility",
          description: "The app must run on both iOS and Android.",
          importance: "HIGH",
        },
        {
          title: "Offline capability",
          description: "The app should cache data locally for offline use by field workers.",
          importance: "MEDIUM",
        },
      ],
      deliverables: [
        {
          title: "iOS app build",
          description: "The cross-platform app published to the Apple App Store.",
        },
        {
          title: "Android app build",
          description: "The cross-platform app published to the Google Play Store.",
        },
      ],
      risks: [
        {
          title: "App store approval delays",
          description: "Apple and Google review processes can take up to 2 weeks.",
          severity: "MEDIUM",
        },
      ],
      missingInformation: [
        {
          question: "Are there specific brand guidelines to follow?",
          reason: "The brief does not reference a brand style guide.",
        },
      ],
      suggestedTasks: [
        {
          suggestionId: "demo_suggested_task_1",
          title: "Set up cross-platform development environment",
          description: "Configure React Native or Flutter development environment for iOS and Android.",
          priority: "HIGH",
        },
        {
          suggestionId: "demo_suggested_task_2",
          title: "Implement offline data caching",
          description: "Set up local storage for offline data capability.",
          priority: "MEDIUM",
        },
      ],
    },
  );
  console.log("Created demo AI analysis");

  await createDemoAIAnalysisFeedback(prisma, ctx, projectIds.mobile, aiAnalysis.id);
  console.log("Created demo AI analysis feedback");

  const inProgressTask = tasks.find((t) => t.title === "Demo — Implement login flow");
  const inProgressTaskId = inProgressTask ? inProgressTask.id : tasks[0]!.id;

  await createDemoActivity(prisma, ctx, {
    leadIds: leads.map((l) => l.id),
    clientIds: clients.map((c) => c.id),
    projectIds: projects.map((p) => p.id),
    taskId: inProgressTaskId,
  });
  console.log("Created demo activity records");

  await createDemoAIConversation(prisma, ctx, projectIds.website);
  console.log("Created demo AI conversation");

  const credentials = getDemoUserCredentials();
  console.log("\nSeed complete.");
  console.log(`Demo workspace: ${org.name}`);
  console.log(`Demo owner: ${credentials.email} (${credentials.password})`);
  console.log(`Demo member: demo-member@example.test (DemoPass123!)`);
  console.log("\nNOTE: Demo Supabase Auth users must be created manually in the Supabase Dashboard.");
  console.log("Use these auth user IDs:");
  console.log("  Owner authUserId: demo_owner_auth_uid");
  console.log("  Member authUserId: demo_member_auth_uid");
  console.log("Then sign in with the email/password above to use the demo workspace.\n");
}

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

runSeed(prisma)
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
