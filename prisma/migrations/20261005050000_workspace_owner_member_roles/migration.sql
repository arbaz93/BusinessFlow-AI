UPDATE "OrganizationMember"
SET "role" = 'MEMBER'
WHERE "role"::TEXT = 'ADMIN';

UPDATE "OrganizationInvitation"
SET "role" = 'MEMBER'
WHERE "role"::TEXT = 'ADMIN';

ALTER TABLE "OrganizationMember"
  ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "OrganizationInvitation"
  ALTER COLUMN "role" DROP DEFAULT;

CREATE TYPE "OrganizationRole_new" AS ENUM ('OWNER', 'MEMBER');

ALTER TABLE "OrganizationMember"
  ALTER COLUMN "role" TYPE "OrganizationRole_new"
  USING "role"::TEXT::"OrganizationRole_new";

ALTER TABLE "OrganizationInvitation"
  ALTER COLUMN "role" TYPE "OrganizationRole_new"
  USING "role"::TEXT::"OrganizationRole_new";

DROP TYPE "OrganizationRole";
ALTER TYPE "OrganizationRole_new" RENAME TO "OrganizationRole";

ALTER TABLE "OrganizationMember"
  ALTER COLUMN "role" SET DEFAULT 'MEMBER';

ALTER TABLE "OrganizationInvitation"
  ALTER COLUMN "role" SET DEFAULT 'MEMBER';
