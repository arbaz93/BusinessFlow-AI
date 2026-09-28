ALTER TYPE "ActivityType" ADD VALUE 'LEAD_DELETED';

ALTER TABLE "Client" DROP CONSTRAINT "Client_organizationId_leadId_fkey";
ALTER TABLE "Client" ADD CONSTRAINT "Client_organizationId_leadId_fkey"
    FOREIGN KEY ("organizationId", "leadId") REFERENCES "Lead"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;