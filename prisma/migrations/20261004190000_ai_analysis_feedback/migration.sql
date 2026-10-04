CREATE TYPE "AIAnalysisFeedbackTargetType" AS ENUM (
  'ANALYSIS',
  'SUMMARY',
  'REQUIREMENT',
  'DELIVERABLE',
  'RISK',
  'MISSING_INFORMATION',
  'SUGGESTED_TASK'
);

CREATE TYPE "AIAnalysisFeedbackType" AS ENUM (
  'INCORRECT',
  'MISSING_INFORMATION',
  'NOT_RELEVANT',
  'DUPLICATE',
  'NOT_ACTIONABLE',
  'TOO_GENERIC',
  'OTHER'
);

CREATE TABLE "AIAnalysisFeedback" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "analysisId" TEXT NOT NULL,
  "targetType" "AIAnalysisFeedbackTargetType" NOT NULL,
  "targetId" TEXT NOT NULL,
  "feedbackType" "AIAnalysisFeedbackType" NOT NULL,
  "comment" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AIAnalysisFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AIAnalysisFeedback_user_target_key"
  ON "AIAnalysisFeedback" ("organizationId", "analysisId", "targetType", "targetId", "createdById");

CREATE INDEX "AIAnalysisFeedback_organizationId_projectId_analysisId_createdAt_idx"
  ON "AIAnalysisFeedback" ("organizationId", "projectId", "analysisId", "createdAt");

CREATE INDEX "AIAnalysisFeedback_createdById_idx"
  ON "AIAnalysisFeedback" ("createdById");

ALTER TABLE "AIAnalysisFeedback"
  ADD CONSTRAINT "AIAnalysisFeedback_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;

ALTER TABLE "AIAnalysisFeedback"
  ADD CONSTRAINT "AIAnalysisFeedback_organizationId_projectId_fkey"
  FOREIGN KEY ("organizationId", "projectId")
  REFERENCES "Project"("organizationId", "id") ON DELETE CASCADE;

ALTER TABLE "AIAnalysisFeedback"
  ADD CONSTRAINT "AIAnalysisFeedback_organizationId_projectId_analysisId_fkey"
  FOREIGN KEY ("organizationId", "projectId", "analysisId")
  REFERENCES "ProjectAIAnalysis"("organizationId", "projectId", "id") ON DELETE CASCADE;

ALTER TABLE "AIAnalysisFeedback"
  ADD CONSTRAINT "AIAnalysisFeedback_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT;
