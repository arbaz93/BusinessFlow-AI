-- Use the globally unique task ID for the optional activity relation. A composite
-- SET NULL would also null organizationId, which is required on Activity.
ALTER TABLE "Activity"
    DROP CONSTRAINT "Activity_organizationId_taskId_fkey";

ALTER TABLE "Activity"
    ADD CONSTRAINT "Activity_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "Task"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
