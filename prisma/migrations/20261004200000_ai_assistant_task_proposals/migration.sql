-- New model: AIAssistantTaskProposal
-- Provenance record for a Task drafted by the AI Assistant and awaiting (or
-- granted) explicit human approval. Mirrors the proven AISuggestedTaskApproval
-- pattern: the FK `taskId` is @unique (1:1), so a proposal can only ever
-- produce a single Task. No Task columns are altered.

CREATE TABLE "AIAssistantTaskProposal" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "messageId" TEXT,
  "taskId" TEXT,
  "projectId" TEXT NOT NULL,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
  "dueDate" TIMESTAMP(3),
  "assigneeId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AIAssistantTaskProposal_pkey" PRIMARY KEY ("id")
);

-- A proposal may yield at most one Task (1:1). This is the core
-- double-submit / duplicate-creation guard at the database level.
CREATE UNIQUE INDEX "AIAssistantTaskProposal_taskId_key"
  ON "AIAssistantTaskProposal" ("taskId");

-- Name is Prisma's truncated default for @@index([organizationId, conversationId, createdAt]).
CREATE INDEX "AIAssistantTaskProposal_organizationId_conversationId_creat_idx"
  ON "AIAssistantTaskProposal" ("organizationId", "conversationId", "createdAt");

ALTER TABLE "AIAssistantTaskProposal"
  ADD CONSTRAINT "AIAssistantTaskProposal_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AIAssistantTaskProposal"
  ADD CONSTRAINT "AIAssistantTaskProposal_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AIAssistantTaskProposal"
  ADD CONSTRAINT "AIAssistantTaskProposal_organizationId_projectId_fkey"
  FOREIGN KEY ("organizationId", "projectId") REFERENCES "Project"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AIAssistantTaskProposal"
  ADD CONSTRAINT "AIAssistantTaskProposal_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AIAssistantTaskProposal"
  ADD CONSTRAINT "AIAssistantTaskProposal_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AIAssistantTaskProposal"
  ADD CONSTRAINT "AIAssistantTaskProposal_assigneeId_fkey"
  FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Inverse relation on Task (read-only provenance navigation, no new column).
-- (Defined as a 1:1 relation with the FK living on this table in Prisma.)