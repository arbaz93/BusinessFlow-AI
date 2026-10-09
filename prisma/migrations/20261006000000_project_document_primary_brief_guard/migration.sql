-- Enforce the one-primary-brief invariant at the database level.
-- A project may have zero or one primary Project Brief, even under concurrent writes.

-- Data fix for existing development data: where a project has more than one
-- primary brief, keep the most recently created one (the record the Documents
-- UI shows first) and clear the primary flag on the others.
UPDATE "ProjectDocument" AS pd
SET "isPrimary" = false
WHERE pd."isPrimary" = true
  AND pd.id <> (
    SELECT keeper.id
    FROM "ProjectDocument" keeper
    WHERE keeper."organizationId" = pd."organizationId"
      AND keeper."projectId" = pd."projectId"
      AND keeper."isPrimary" = true
    ORDER BY keeper."createdAt" DESC, keeper.id DESC
    LIMIT 1
  );

CREATE UNIQUE INDEX "ProjectDocument_one_primary_brief"
  ON "ProjectDocument" ("organizationId", "projectId")
WHERE "isPrimary" = true;
