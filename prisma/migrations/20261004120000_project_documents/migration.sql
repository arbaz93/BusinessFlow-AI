CREATE TYPE "ProjectDocumentType" AS ENUM (
  'PROJECT_BRIEF',
  'CLIENT_ASSET',
  'REFERENCE',
  'DESIGN',
  'DELIVERABLE',
  'OTHER'
);

CREATE TABLE "ProjectDocument" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "uploadedById" TEXT,
  "name" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "documentType" "ProjectDocumentType" NOT NULL DEFAULT 'OTHER',
  "mimeType" TEXT,
  "sizeBytes" INTEGER,
  "storagePath" TEXT,
  "storageUrl" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProjectDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectDocument_organizationId_id_key"
  ON "ProjectDocument" ("organizationId", "id");

CREATE INDEX "ProjectDocument_organizationId_projectId_idx"
  ON "ProjectDocument" ("organizationId", "projectId");

CREATE INDEX "ProjectDocument_organizationId_projectId_documentType_idx"
  ON "ProjectDocument" ("organizationId", "projectId", "documentType");

CREATE INDEX "ProjectDocument_projectId_idx"
  ON "ProjectDocument" ("projectId");

ALTER TABLE "ProjectDocument"
  ADD CONSTRAINT "ProjectDocument_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;

ALTER TABLE "ProjectDocument"
  ADD CONSTRAINT "ProjectDocument_organizationId_projectId_fkey"
  FOREIGN KEY ("organizationId", "projectId") REFERENCES "Project"("organizationId", "id") ON DELETE RESTRICT;

ALTER TABLE "ProjectDocument"
  ADD CONSTRAINT "ProjectDocument_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL;
