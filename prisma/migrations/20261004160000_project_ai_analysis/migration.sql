CREATE TYPE "ProjectAIAnalysisStatus" AS ENUM (
  'PROCESSING',
  'COMPLETED',
  'FAILED'
);

CREATE TABLE "ProjectAIAnalysis" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "sourceDocumentId" TEXT,
  "sourceDocumentName" TEXT NOT NULL,
  "sourceDocumentUpdatedAt" TIMESTAMP(3) NOT NULL,
  "status" "ProjectAIAnalysisStatus" NOT NULL DEFAULT 'PROCESSING',
  "result" JSONB,
  "errorCode" TEXT,
  "model" TEXT NOT NULL,
  "analysisVersion" INTEGER NOT NULL DEFAULT 1,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProjectAIAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectDocument_organizationId_projectId_id_key"
  ON "ProjectDocument" ("organizationId", "projectId", "id");

CREATE INDEX "ProjectAIAnalysis_organizationId_projectId_createdAt_idx"
  ON "ProjectAIAnalysis" ("organizationId", "projectId", "createdAt");

CREATE INDEX "ProjectAIAnalysis_organizationId_projectId_sourceDocumentId_idx"
  ON "ProjectAIAnalysis" ("organizationId", "projectId", "sourceDocumentId");

CREATE INDEX "ProjectAIAnalysis_status_updatedAt_idx"
  ON "ProjectAIAnalysis" ("status", "updatedAt");

CREATE UNIQUE INDEX "ProjectAIAnalysis_one_processing_per_source_version_key"
  ON "ProjectAIAnalysis" ("organizationId", "projectId", "sourceDocumentId", "sourceDocumentUpdatedAt", "analysisVersion")
  WHERE "status" = 'PROCESSING' AND "sourceDocumentId" IS NOT NULL;

ALTER TABLE "ProjectAIAnalysis"
  ADD CONSTRAINT "ProjectAIAnalysis_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;

ALTER TABLE "ProjectAIAnalysis"
  ADD CONSTRAINT "ProjectAIAnalysis_organizationId_projectId_fkey"
  FOREIGN KEY ("organizationId", "projectId") REFERENCES "Project"("organizationId", "id") ON DELETE CASCADE;

ALTER TABLE "ProjectAIAnalysis"
  ADD CONSTRAINT "ProjectAIAnalysis_sourceDocumentId_fkey"
  FOREIGN KEY ("sourceDocumentId") REFERENCES "ProjectDocument"("id") ON DELETE SET NULL;

CREATE FUNCTION "validate_project_ai_analysis_source"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."sourceDocumentId" IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM "ProjectDocument"
    WHERE "id" = NEW."sourceDocumentId"
      AND "organizationId" = NEW."organizationId"
      AND "projectId" = NEW."projectId"
      AND "documentType" = 'PROJECT_BRIEF'
  ) THEN
    RAISE EXCEPTION 'Project AI analysis source must be a Project Brief in the same organization and project'
      USING ERRCODE = '23514',
            CONSTRAINT = 'ProjectAIAnalysis_sourceDocument_scope_check';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "ProjectAIAnalysis_sourceDocument_scope_trigger"
BEFORE INSERT OR UPDATE OF "organizationId", "projectId", "sourceDocumentId"
ON "ProjectAIAnalysis"
FOR EACH ROW
EXECUTE FUNCTION "validate_project_ai_analysis_source"();
