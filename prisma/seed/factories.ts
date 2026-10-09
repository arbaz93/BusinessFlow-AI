/**
 * Demo data factories for development seeding.
 *
 * These functions create synthetic, clearly identifiable BusinessFlow demo
 * data. They are NEVER used in production and are guarded by the environment
 * check in env-guard.ts before any execution.
 *
 * All data is deterministic (no random values) to make bugs reproducible.
 */

import type { PrismaClient, Prisma } from "../../app/generated/prisma/client";
import {
  ActivityType,
  AIAnalysisFeedbackTargetType,
  AIAnalysisFeedbackType,
  AIConversationMessageRole,
  LeadStatus,
  ClientStatus,
  ProjectStatus,
  ProjectPriority,
  TaskPriority,
  TaskStatus,
  ProjectDocumentType,
  ProjectAIAnalysisStatus,
} from "../../app/generated/prisma/enums";

type Prisma = PrismaClient;

export interface SeedContext {
  organizationId: string;
  ownerUserId: string;
  ownerAuthUserId: string;
  memberUserId: string;
  memberAuthUserId: string;
}

const DEMO_USER_NAME = "Demo Owner";
const DEMO_MEMBER_NAME = "Demo Member";
const DEMO_USER_EMAIL = "demo-owner@example.test";
const DEMO_MEMBER_EMAIL = "demo-member@example.test";
const DEMO_USER_PASSWORD = "DemoPass123!";

export { DEMO_USER_EMAIL, DEMO_USER_NAME, DEMO_MEMBER_NAME, DEMO_MEMBER_EMAIL };
export const DEMO_USER_PASSWORD_VALUE = DEMO_USER_PASSWORD;

const now = new Date();
const TWO_DAYS_AGO = new Date(now.getTime() - 2 * 86_240_000);
const ONE_WEEK_AGO = new Date(now.getTime() - 7 * 86_240_000);
const TWO_WEEKS_AGO = new Date(now.getTime() - 14 * 86_240_000);
const ONE_MONTH_AGO = new Date(now.getTime() - 30 * 86_240_000);
const ONE_HOUR_AGO = new Date(now.getTime() - 3_600_000);
const ONE_DAY_AGO = new Date(now.getTime() - 86_240_000);
const FIVE_DAYS_AGO = new Date(now.getTime() - 5 * 86_240_000);
const TWO_MONTHS_AGO = new Date(now.getTime() - 60 * 86_240_000);

export function getDemoUserCredentials() {
  return {
    email: DEMO_USER_EMAIL,
    password: DEMO_USER_PASSWORD,
    name: DEMO_USER_NAME,
  };
}

export function createDemoOrganization(prisma: Prisma) {
  return prisma.organization.upsert({
    where: { slug: "demo-workspace" },
    update: { name: "Demo Workspace", businessType: "OTHER" },
    create: { name: "Demo Workspace", businessType: "OTHER", slug: "demo-workspace" },
  });
}

export async function createDemoUsers(
  prisma: Prisma,
  organizationId: string,
  ownerAuthUserId: string,
  memberAuthUserId: string,
) {
  return prisma.$transaction(async (tx) => {
    const owner = await tx.user.upsert({
      where: { authUserId: ownerAuthUserId },
      update: {},
      create: {
        authUserId: ownerAuthUserId,
        name: DEMO_USER_NAME,
        email: DEMO_USER_EMAIL,
      },
    });

    const member = await tx.user.upsert({
      where: { authUserId: memberAuthUserId },
      update: {},
      create: {
        authUserId: memberAuthUserId,
        name: DEMO_MEMBER_NAME,
        email: DEMO_MEMBER_EMAIL,
      },
    });

    await tx.organizationMember.upsert({
      where: { organizationId_userId: { organizationId, userId: owner.id } },
      update: { role: "OWNER" },
      create: { organizationId, userId: owner.id, role: "OWNER" },
    });

    await tx.organizationMember.upsert({
      where: { organizationId_userId: { organizationId, userId: member.id } },
      update: { role: "MEMBER" },
      create: { organizationId, userId: member.id, role: "MEMBER" },
    });

    return { owner, member };
  });
}

export function createDemoLeads(prisma: Prisma, ctx: SeedContext) {
  return prisma.$transaction(async (tx) => {
    const leads = [];

    const lead1 = await tx.lead.upsert({
      where: { organizationId_id: { organizationId: ctx.organizationId, id: "demo_lead_new" } },
      update: {},
      create: {
        id: "demo_lead_new",
        organizationId: ctx.organizationId,
        name: "Demo Lead — New Inquiry",
        email: "lead@example.test",
        company: "Demo Acme Corp",
        source: "WEBSITE",
        notes: "Initial inquiry from the demo website contact form.",
        status: LeadStatus.NEW,
        estimatedValue: 5000.0,
        currency: "USD",
        createdById: ctx.ownerUserId,
      },
    });
    leads.push(lead1);

    const lead2 = await tx.lead.upsert({
      where: { organizationId_id: { organizationId: ctx.organizationId, id: "demo_lead_contacted" } },
      update: {},
      create: {
        id: "demo_lead_contacted",
        organizationId: ctx.organizationId,
        name: "Demo Lead — Contacted Prospect",
        email: "lead@example.test",
        company: "Demo Beta LLC",
        source: "REFERRAL",
        notes: "Referred by a current client. Follow-up call scheduled.",
        status: LeadStatus.CONTACTED,
        estimatedValue: 7500.0,
        currency: "USD",
        createdById: ctx.ownerUserId,
      },
    });
    leads.push(lead2);

    const lead3 = await tx.lead.upsert({
      where: { organizationId_id: { organizationId: ctx.organizationId, id: "demo_lead_qualified" } },
      update: {},
      create: {
        id: "demo_lead_qualified",
        organizationId: ctx.organizationId,
        name: "Demo Lead — Qualified",
        email: "lead@example.test",
        company: "Demo Gamma Inc",
        source: "LINKEDIN",
        notes: "Qualified lead interested in the enterprise plan.",
        status: LeadStatus.QUALIFIED,
        estimatedValue: 12000.0,
        currency: "USD",
        createdById: ctx.ownerUserId,
        convertedAt: ONE_WEEK_AGO,
      },
    });
    leads.push(lead3);

    const lead4 = await tx.lead.upsert({
      where: { organizationId_id: { organizationId: ctx.organizationId, id: "demo_lead_proposal" } },
      update: {},
      create: {
        id: "demo_lead_proposal",
        organizationId: ctx.organizationId,
        name: "Demo Lead — Proposal Sent",
        email: "lead@example.test",
        company: "Demo Delta Co",
        source: "SOCIAL_MEDIA",
        notes: "Proposal sent last week, awaiting feedback.",
        status: LeadStatus.PROPOSAL_SENT,
        estimatedValue: 9000.0,
        currency: "USD",
        createdById: ctx.ownerUserId,
      },
    });
    leads.push(lead4);

    const lead5 = await tx.lead.upsert({
      where: { organizationId_id: { organizationId: ctx.organizationId, id: "demo_lead_won" } },
      update: {},
      create: {
        id: "demo_lead_won",
        organizationId: ctx.organizationId,
        name: "Demo Lead — Won Deal",
        email: "lead@example.test",
        company: "Demo Client Corp",
        source: "COLD_OUTREACH",
        notes: "Converted to client after successful proposal.",
        status: LeadStatus.WON,
        estimatedValue: 10000.0,
        currency: "USD",
        createdById: ctx.ownerUserId,
        convertedAt: TWO_WEEKS_AGO,
      },
    });
    leads.push(lead5);

    const lead6 = await tx.lead.upsert({
      where: { organizationId_id: { organizationId: ctx.organizationId, id: "demo_lead_lost" } },
      update: {},
      create: {
        id: "demo_lead_lost",
        organizationId: ctx.organizationId,
        name: "Demo Lead — Lost Deal",
        email: "lead@example.test",
        company: "Demo Epsilon Ltd",
        source: "OTHER",
        notes: "Lost to a competitor. Price was the deciding factor.",
        status: LeadStatus.LOST,
        estimatedValue: 3000.0,
        currency: "USD",
        createdById: ctx.ownerUserId,
      },
    });
    leads.push(lead6);

    return leads;
  });
}

export function createDemoClients(prisma: Prisma, ctx: SeedContext, leadIds: { convertedId: string; wonId: string }) {
  return prisma.$transaction(async (tx) => {
    const clients = [];

    const client1 = await tx.client.upsert({
      where: { organizationId_id: { organizationId: ctx.organizationId, id: "demo_client_converted" } },
      update: {},
      create: {
        id: "demo_client_converted",
        organizationId: ctx.organizationId,
        leadId: leadIds.convertedId,
        name: "Demo Client Corp",
        email: "contact@democlient.example.test",
        company: "Demo Client Corp",
        notes: "Active client from the qualified lead conversion.",
        status: ClientStatus.ACTIVE,
      },
    });
    clients.push(client1);

    const client2 = await tx.client.upsert({
      where: { organizationId_id: { organizationId: ctx.organizationId, id: "demo_client_won" } },
      update: {},
      create: {
        id: "demo_client_won",
        organizationId: ctx.organizationId,
        leadId: leadIds.wonId,
        name: "Demo Client Corp (Won)",
        email: "contact@democlient-won.example.test",
        company: "Demo Client Corp (Won)",
        notes: "Client won after successful proposal pitch.",
        status: ClientStatus.ACTIVE,
      },
    });
    clients.push(client2);

    const client3 = await tx.client.upsert({
      where: { organizationId_id: { organizationId: ctx.organizationId, id: "demo_client_inactive" } },
      update: {},
      create: {
        id: "demo_client_inactive",
        organizationId: ctx.organizationId,
        name: "Demo Inactive Client",
        email: "contact@inactive.example.test",
        company: "Inactive Demo LLC",
        notes: "Client went inactive after project completion.",
        status: ClientStatus.INACTIVE,
      },
    });
    clients.push(client3);

    return clients;
  });
}

export function createDemoProjects(
  prisma: Prisma,
  ctx: SeedContext,
  clientIds: { convertedId: string; wonId: string; inactiveId: string },
) {
  return prisma.$transaction(async (tx) => {
    const projects = [];

    const project1 = await tx.project.upsert({
      where: { organizationId_id: { organizationId: ctx.organizationId, id: "demo_project_website" } },
      update: {},
      create: {
        id: "demo_project_website",
        organizationId: ctx.organizationId,
        clientId: clientIds.convertedId,
        name: "Demo — Website Redesign",
        description: "Modernizing the client's website with a new responsive design and improved conversion paths.",
        status: ProjectStatus.PLANNING,
        priority: ProjectPriority.HIGH,
        startDate: now,
        dueDate: new Date(now.getTime() + 30 * 86_240_000),
        notes: "Phase 1: Discovery and briefing.",
        createdById: ctx.ownerUserId,
      },
    });
    projects.push(project1);

    const project2 = await tx.project.upsert({
      where: { organizationId_id: { organizationId: ctx.organizationId, id: "demo_project_mobile" } },
      update: {},
      create: {
        id: "demo_project_mobile",
        organizationId: ctx.organizationId,
        clientId: clientIds.wonId,
        name: "Demo — Mobile App Development",
        description: "Building a cross-platform mobile app for client operations management.",
        status: ProjectStatus.IN_PROGRESS,
        priority: ProjectPriority.URGENT,
        startDate: ONE_MONTH_AGO,
        dueDate: new Date(now.getTime() + 14 * 86_240_000),
        notes: "MVP features in development. Weekly check-ins.",
        createdById: ctx.ownerUserId,
      },
    });
    projects.push(project2);

    const project3 = await tx.project.upsert({
      where: { organizationId_id: { organizationId: ctx.organizationId, id: "demo_project_brand" } },
      update: {},
      create: {
        id: "demo_project_brand",
        organizationId: ctx.organizationId,
        clientId: clientIds.inactiveId,
        name: "Demo — Brand Refresh",
        description: "Complete visual identity refresh for the client's marketing materials.",
        status: ProjectStatus.ON_HOLD,
        priority: ProjectPriority.MEDIUM,
        startDate: ONE_MONTH_AGO,
        dueDate: TWO_MONTHS_AGO,
        notes: "On hold pending client budget approval for Q4.",
        createdById: ctx.ownerUserId,
      },
    });
    projects.push(project3);

    const project4 = await tx.project.upsert({
      where: { organizationId_id: { organizationId: ctx.organizationId, id: "demo_project_ecommerce" } },
      update: {},
      create: {
        id: "demo_project_ecommerce",
        organizationId: ctx.organizationId,
        clientId: clientIds.convertedId,
        name: "Demo — E-commerce Integration",
        description: "Implemented a new e-commerce checkout flow for the client's storefront.",
        status: ProjectStatus.COMPLETED,
        priority: ProjectPriority.HIGH,
        startDate: new Date(now.getTime() - 90 * 86_240_000),
        dueDate: new Date(now.getTime() - 30 * 86_240_000),
        notes: "Delivered on time. Client very satisfied.",
        createdById: ctx.ownerUserId,
        completedAt: ONE_MONTH_AGO,
      },
    });
    projects.push(project4);

    const project5 = await tx.project.upsert({
      where: { organizationId_id: { organizationId: ctx.organizationId, id: "demo_project_api" } },
      update: {},
      create: {
        id: "demo_project_api",
        organizationId: ctx.organizationId,
        clientId: clientIds.wonId,
        name: "Demo — API Migration",
        description: "Planned migration of legacy APIs to a modern microservices architecture.",
        status: ProjectStatus.CANCELLED,
        priority: ProjectPriority.LOW,
        startDate: ONE_WEEK_AGO,
        dueDate: new Date(now.getTime() + 60 * 86_240_000),
        notes: "Cancelled by client due to scope concerns.",
        createdById: ctx.ownerUserId,
      },
    });
    projects.push(project5);

    return projects;
  });
}

export interface DemoProjectIds {
  website: string;
  mobile: string;
  brand: string;
  ecommerce: string;
  api: string;
}

export function createDemoTasks(prisma: Prisma, ctx: SeedContext, projectIds: DemoProjectIds) {
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);

  const overdue = new Date(startOfDay.getTime() - 2 * 86_240_000);
  const todayD = new Date(startOfDay.getTime() + 4 * 3600_000);
  const upcoming = new Date(startOfDay.getTime() + 2 * 86_240_000);

  return prisma.$transaction(async (tx) => {
    const tasks = [];

    tasks.push(
      await tx.task.upsert({
        where: { organizationId_id: { organizationId: ctx.organizationId, id: "demo_task_overdue" } },
        update: {},
        create: {
          id: "demo_task_overdue",
          organizationId: ctx.organizationId,
          projectId: projectIds.mobile,
          title: "Demo — Finalize API endpoints",
          description: "Complete the API endpoint specification before the frontend team can begin integration.",
          status: TaskStatus.TODO,
          priority: TaskPriority.HIGH,
          dueDate: overdue,
          assigneeId: ctx.memberUserId,
          createdById: ctx.ownerUserId,
        },
      }),
    );

    tasks.push(
      await tx.task.upsert({
        where: { organizationId_id: { organizationId: ctx.organizationId, id: "demo_task_in_progress" } },
        update: {},
        create: {
          id: "demo_task_in_progress",
          organizationId: ctx.organizationId,
          projectId: projectIds.mobile,
          title: "Demo — Implement login flow",
          description: "Build the user authentication flow with email/password and social login options.",
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          dueDate: todayD,
          assigneeId: ctx.ownerUserId,
          createdById: ctx.ownerUserId,
        },
      }),
    );

    tasks.push(
      await tx.task.upsert({
        where: { organizationId_id: { organizationId: ctx.organizationId, id: "demo_task_blocked" } },
        update: {},
        create: {
          id: "demo_task_blocked",
          organizationId: ctx.organizationId,
          projectId: projectIds.mobile,
          title: "Demo — Third-party payment integration",
          description: "Waiting on client API keys from the payment provider.",
          status: TaskStatus.BLOCKED,
          priority: TaskPriority.URGENT,
          dueDate: upcoming,
          assigneeId: ctx.memberUserId,
          createdById: ctx.ownerUserId,
        },
      }),
    );

    tasks.push(
      await tx.task.upsert({
        where: { organizationId_id: { organizationId: ctx.organizationId, id: "demo_task_completed" } },
        update: {},
        create: {
          id: "demo_task_completed",
          organizationId: ctx.organizationId,
          projectId: projectIds.ecommerce,
          title: "Demo — Homepage redesign",
          description: "Redesigned the homepage with modern layout and improved CTAs.",
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.MEDIUM,
          dueDate: new Date(startOfDay.getTime() - 10 * 86_240_000),
          assigneeId: ctx.ownerUserId,
          createdById: ctx.ownerUserId,
          completedAt: new Date(startOfDay.getTime() - 8 * 86_240_000),
        },
      }),
    );

    tasks.push(
      await tx.task.upsert({
        where: { organizationId_id: { organizationId: ctx.organizationId, id: "demo_task_no_due_date" } },
        update: {},
        create: {
          id: "demo_task_no_due_date",
          organizationId: ctx.organizationId,
          projectId: projectIds.website,
          title: "Demo — Research competitor patterns",
          description: "Study competitor websites for inspiration. No specific deadline.",
          status: TaskStatus.TODO,
          priority: TaskPriority.LOW,
          dueDate: null,
          assigneeId: ctx.memberUserId,
          createdById: ctx.ownerUserId,
        },
      }),
    );

    tasks.push(
      await tx.task.upsert({
        where: { organizationId_id: { organizationId: ctx.organizationId, id: "demo_task_upcoming" } },
        update: {},
        create: {
          id: "demo_task_upcoming",
          organizationId: ctx.organizationId,
          projectId: projectIds.mobile,
          title: "Demo — Design mobile wireframes",
          description: "Create low-fidelity wireframes for the mobile app screens.",
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          dueDate: upcoming,
          assigneeId: ctx.memberUserId,
          createdById: ctx.ownerUserId,
        },
      }),
    );

    return tasks;
  });
}

export const DEMO_BRIEF_CONTENT = `# Demo Mobile App Brief

## Overview
A brief for the demo mobile app development project focused on building a cross-platform operations management app.

## Goals
- Create a unified experience across iOS and Android
- Implement offline data caching for field workers
- Integrate with existing client systems

## Deliverables
- iOS app build
- Android app build
- Offline data sync capability
- Admin dashboard

## Timeline
- Discovery: Week 1
- Development: Weeks 2-10
- Testing & Launch: Week 11-12

## Budget
- $25,000 allocated for this phase of work.

## Stakeholders
- Project Lead: Demo Owner
- Design Lead: Demo Member
`;

export function createDemoDocuments(prisma: Prisma, ctx: SeedContext, projectIds: DemoProjectIds) {
  return prisma.$transaction(async (tx) => {
    const documents = [];

    documents.push(
      await tx.projectDocument.upsert({
        where: { organizationId_id: { organizationId: ctx.organizationId, id: "demo_doc_brief" } },
        update: { isPrimary: true },
        create: {
          id: "demo_doc_brief",
          organizationId: ctx.organizationId,
          projectId: projectIds.mobile,
          uploadedById: ctx.ownerUserId,
          name: "Demo Mobile App Brief",
          originalName: "Demo_Mobile_App_Brief.md",
          documentType: ProjectDocumentType.PROJECT_BRIEF,
          mimeType: "text/markdown",
          sizeBytes: 2048,
          storagePath: `organizations/${ctx.organizationId}/projects/${projectIds.mobile}/documents/demo_doc_brief/Demo_Mobile_App_Brief.md`,
          storageUrl: null,
          isPrimary: true,
        },
      }),
    );

    documents.push(
      await tx.projectDocument.upsert({
        where: { organizationId_id: { organizationId: ctx.organizationId, id: "demo_doc_wireframe" } },
        update: {},
        create: {
          id: "demo_doc_wireframe",
          organizationId: ctx.organizationId,
          projectId: projectIds.mobile,
          uploadedById: ctx.memberUserId,
          name: "Demo Mobile Wireframes",
          originalName: "Mobile_Wireframes.png",
          documentType: ProjectDocumentType.DESIGN,
          mimeType: "image/png",
          sizeBytes: 102400,
          storagePath: `organizations/${ctx.organizationId}/projects/${projectIds.mobile}/documents/demo_doc_wireframe/Mobile_Wireframes.png`,
          storageUrl: null,
          isPrimary: false,
        },
      }),
    );

    documents.push(
      await tx.projectDocument.upsert({
        where: { organizationId_id: { organizationId: ctx.organizationId, id: "demo_doc_brief_2" } },
        update: { isPrimary: true },
        create: {
          id: "demo_doc_brief_2",
          organizationId: ctx.organizationId,
          projectId: projectIds.website,
          uploadedById: ctx.ownerUserId,
          name: "Demo Website Redesign Brief",
          originalName: "Demo_Website_Redesign_Brief.md",
          documentType: ProjectDocumentType.PROJECT_BRIEF,
          mimeType: "text/markdown",
          sizeBytes: 3072,
          storagePath: `organizations/${ctx.organizationId}/projects/${projectIds.website}/documents/demo_doc_brief_2/Demo_Website_Redesign_Brief.md`,
          storageUrl: null,
          isPrimary: true,
        },
      }),
    );

    return documents;
  });
}

export function createDemoAIAnalysis(
  prisma: Prisma,
  ctx: SeedContext,
  projectId: string,
  sourceDocumentId: string,
  sourceDocumentName: string,
  sourceDocumentUpdatedAt: Date,
  result: Prisma.InputJsonValue,
) {
  return prisma.projectAIAnalysis.upsert({
    where: { organizationId_projectId_id: { organizationId: ctx.organizationId, projectId, id: "demo_ai_analysis" } },
    update: {
      status: ProjectAIAnalysisStatus.COMPLETED,
      result,
      completedAt: FIVE_DAYS_AGO,
      updatedAt: FIVE_DAYS_AGO,
    },
    create: {
      id: "demo_ai_analysis",
      organizationId: ctx.organizationId,
      projectId,
      sourceDocumentId,
      sourceDocumentName,
      sourceDocumentUpdatedAt,
      status: ProjectAIAnalysisStatus.COMPLETED,
      result,
      model: "gemini-2.5-flash",
      analysisVersion: 1,
      completedAt: FIVE_DAYS_AGO,
      updatedAt: FIVE_DAYS_AGO,
    },
  });
}

export function createDemoAIAnalysisFeedback(
  prisma: Prisma,
  ctx: SeedContext,
  projectId: string,
  analysisId: string,
) {
  return prisma.$transaction(async (tx) => {
    await tx.aIAnalysisFeedback.upsert({
      where: {
        organizationId_analysisId_targetType_targetId_createdById: {
          organizationId: ctx.organizationId,
          analysisId,
          targetType: AIAnalysisFeedbackTargetType.SUMMARY,
          targetId: "demo_summary_feedback",
          createdById: ctx.ownerUserId,
        },
      },
      update: {},
      create: {
        organizationId: ctx.organizationId,
        projectId,
        analysisId,
        targetType: AIAnalysisFeedbackTargetType.SUMMARY,
        targetId: "demo_summary_feedback",
        feedbackType: AIAnalysisFeedbackType.MISSING_INFORMATION,
        comment: "The summary could include more details about the mobile platform requirements.",
        createdById: ctx.ownerUserId,
      },
    });
  });
}

export function createDemoActivity(
  prisma: Prisma,
  ctx: SeedContext,
  entityIds: {
    leadIds: string[];
    clientIds: string[];
    projectIds: string[];
    taskId: string;
  },
) {
  return prisma.$transaction(async (tx) => {
    const activities = [
      { organizationId: ctx.organizationId, actorId: ctx.ownerUserId, leadId: entityIds.leadIds[0], type: ActivityType.LEAD_CREATED, description: "Created lead Demo Lead — New Inquiry", createdAt: ONE_MONTH_AGO },
      { organizationId: ctx.organizationId, actorId: ctx.ownerUserId, leadId: entityIds.leadIds[5], type: ActivityType.LEAD_STATUS_CHANGED, description: "Lead status changed to WON for Demo Lead — Won Deal", createdAt: TWO_WEEKS_AGO },
      { organizationId: ctx.organizationId, actorId: ctx.ownerUserId, clientId: entityIds.clientIds[0], type: ActivityType.CLIENT_CREATED, description: "Created client Demo Client Corp", createdAt: TWO_WEEKS_AGO },
      { organizationId: ctx.organizationId, actorId: ctx.ownerUserId, leadId: entityIds.leadIds[5], type: ActivityType.LEAD_CONVERTED, description: "Converted lead to client Demo Client Corp (Won)", createdAt: TWO_WEEKS_AGO },
      { organizationId: ctx.organizationId, actorId: ctx.ownerUserId, projectId: entityIds.projectIds[0], type: ActivityType.PROJECT_CREATED, description: "Created project Demo — Website Redesign", createdAt: ONE_WEEK_AGO },
      { organizationId: ctx.organizationId, actorId: ctx.memberUserId, projectId: entityIds.projectIds[1], type: ActivityType.PROJECT_STATUS_CHANGED, description: "Project status changed to IN_PROGRESS for Demo — Mobile App Development", createdAt: ONE_DAY_AGO },
      { organizationId: ctx.organizationId, actorId: ctx.ownerUserId, taskId: entityIds.taskId, projectId: entityIds.projectIds[1], type: ActivityType.TASK_STATUS_CHANGED, description: "Completed task Demo — Homepage redesign", createdAt: ONE_HOUR_AGO },
      { organizationId: ctx.organizationId, actorId: ctx.memberUserId, type: ActivityType.DOCUMENT_CREATED, description: "Uploaded document Demo Mobile App Brief", createdAt: TWO_DAYS_AGO },
      { organizationId: ctx.organizationId, actorId: ctx.ownerUserId, projectId: entityIds.projectIds[1], type: ActivityType.PROJECT_AI_ANALYZED, description: "Completed AI analysis for Demo — Mobile App Development", createdAt: FIVE_DAYS_AGO },
      { organizationId: ctx.organizationId, actorId: ctx.memberUserId, projectId: entityIds.projectIds[0], type: ActivityType.DOCUMENT_PRIMARY_SET, description: "Set primary brief for Demo — Website Redesign", createdAt: ONE_DAY_AGO },
    ];

    for (const activity of activities) {
      await tx.activity.create({ data: activity });
    }
  });
}

export function createDemoAIConversation(prisma: Prisma, ctx: SeedContext, projectId: string) {
  return prisma.$transaction(async (tx) => {
    const conversation = await tx.aIConversation.upsert({
      where: { id: "demo_conversation_1" },
      update: { updatedAt: now },
      create: {
        id: "demo_conversation_1",
        organizationId: ctx.organizationId,
        createdById: ctx.ownerUserId,
        title: "Demo — Planning the Website Redesign",
        contextProjectId: projectId,
        memorySummary:
          "The user is planning a website redesign project for Demo Acme Corp. They need help with timeline and deliverables.",
        memoryUpdatedAt: ONE_DAY_AGO,
      },
    });

    const messages = [
      {
        id: "demo_msg_1",
        conversationId: conversation.id,
        role: AIConversationMessageRole.USER,
        content: "Can you help me plan the timeline for the Demo Acme Corp website redesign?",
        requestId: "demo_req_1",
        replyToMessageId: null,
        createdAt: ONE_DAY_AGO,
      },
      {
        id: "demo_msg_2",
        conversationId: conversation.id,
        role: AIConversationMessageRole.ASSISTANT,
        content:
          "I'd be happy to help you plan the website redesign. Based on the project brief, I recommend the following timeline:\n\n1. Discovery & Strategy (Week 1-2)\n2. Design & Prototyping (Week 3-5)\n3. Development (Week 6-10)\n4. Testing & Launch (Week 11-12)\n\nWould you like me to create suggested tasks for this timeline?",
        requestId: null,
        replyToMessageId: "demo_msg_1",
        createdAt: ONE_DAY_AGO,
      },
      {
        id: "demo_msg_3",
        conversationId: conversation.id,
        role: AIConversationMessageRole.USER,
        content: "Yes, please create tasks for the design phase.",
        requestId: "demo_req_2",
        replyToMessageId: null,
        createdAt: ONE_HOUR_AGO,
      },
      {
        id: "demo_msg_4",
        conversationId: conversation.id,
        role: AIConversationMessageRole.ASSISTANT,
        content:
          "I've created the following suggested tasks for the design phase:\n\n- **Design & Prototyping** (High Priority)\n  - Create low-fidelity wireframes\n  - Conduct user research sessions\n  - Design high-fidelity mockups\n  - Get client feedback on designs\n\nThese can be added to your project directly from the AI suggestions panel.",
        requestId: null,
        replyToMessageId: "demo_msg_3",
        createdAt: ONE_HOUR_AGO,
      },
    ];

    for (const msg of messages) {
      const existing = await tx.aIConversationMessage.findUnique({
        where: { id: msg.id },
      });
      if (!existing) {
        await tx.aIConversationMessage.create({ data: msg });
      }
    }

    return conversation;
  });
}
