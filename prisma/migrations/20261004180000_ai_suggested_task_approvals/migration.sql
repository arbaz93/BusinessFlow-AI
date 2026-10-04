CREATE UNIQUE INDEX "ProjectAIAnalysis_organizationId_projectId_id_key"
  ON "ProjectAIAnalysis" ("organizationId", "projectId", "id");

CREATE TABLE "AISuggestedTaskApproval" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "analysisId" TEXT NOT NULL,
  "suggestionId" TEXT NOT NULL,
  "taskId" TEXT,
  "approvedById" TEXT NOT NULL,
  "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AISuggestedTaskApproval_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AISuggestedTaskApproval_analysisId_suggestionId_key"
  ON "AISuggestedTaskApproval" ("analysisId", "suggestionId");

CREATE UNIQUE INDEX "AISuggestedTaskApproval_taskId_key"
  ON "AISuggestedTaskApproval" ("taskId");

CREATE INDEX "AISuggestedTaskApproval_organizationId_projectId_approvedAt_idx"
  ON "AISuggestedTaskApproval" ("organizationId", "projectId", "approvedAt");

ALTER TABLE "AISuggestedTaskApproval"
  ADD CONSTRAINT "AISuggestedTaskApproval_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;

ALTER TABLE "AISuggestedTaskApproval"
  ADD CONSTRAINT "AISuggestedTaskApproval_organizationId_projectId_fkey"
  FOREIGN KEY ("organizationId", "projectId") REFERENCES "Project"("organizationId", "id") ON DELETE CASCADE;

ALTER TABLE "AISuggestedTaskApproval"
  ADD CONSTRAINT "AISuggestedTaskApproval_organizationId_projectId_analysisId_fkey"
  FOREIGN KEY ("organizationId", "projectId", "analysisId")
  REFERENCES "ProjectAIAnalysis"("organizationId", "projectId", "id") ON DELETE CASCADE;

ALTER TABLE "AISuggestedTaskApproval"
  ADD CONSTRAINT "AISuggestedTaskApproval_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL;

ALTER TABLE "AISuggestedTaskApproval"
  ADD CONSTRAINT "AISuggestedTaskApproval_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT;
