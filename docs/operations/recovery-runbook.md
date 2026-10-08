# BusinessFlow AI — Migration & Recovery Runbook

This runbook documents the migration and recovery procedures for BusinessFlow AI. It is written for developers and operators who encounter problems under pressure.

> **Principle**: Known migration history + safe migration commands + protected production environment + verified migration process + honest backup/recovery capabilities + documented recovery procedure + post-recovery integrity checks = operational confidence.

---

## Table of Contents

1. [Migration Architecture](#1-migration-architecture)
2. [Migration Process](#2-migration-process)
3. [Migration Status & Health Checks](#3-migration-status--health-checks)
4. [Failed Migration Procedure](#4-failed-migration-procedure)
5. [Failed Application Deployment Procedure](#5-failed-application-deployment-procedure)
6. [Data Corruption Response](#6-data-corruption-response)
7. [Database Restoration Procedure](#7-database-restoration-procedure)
8. [Storage Recovery Considerations](#8-storage-recovery-considerations)
9. [Auth & Configuration Recovery Considerations](#9-auth--configuration-recovery-considerations)
10. [Tenant Integrity Verification Checklist](#10-tenant-integrity-verification-checklist)
11. [Post-Recovery Smoke Checks](#11-post-recovery-smoke-checks)
12. [Supabase Backup/Recovery Capabilities](#12-supabase-backuprecovery-capabilities)
13. [Recovery Limitations & Deferred Items](#13-recovery-limitations--deferred-items)

---

## 1. Migration Architecture

### Authoritative Mechanism

**Prisma Migrate** is the single authoritative production schema-change mechanism for BusinessFlow AI.

| Environment | Mechanism | Command |
|-------------|-----------|---------|
| Development | `prisma migrate dev` (creates + applies) | `npm run db:migrate:dev -- --name <name>` |
| Test/CI | `prisma migrate deploy` (applies existing) | `npm run db:migrate:deploy` |
| Production | `prisma migrate deploy` (applies reviewed migrations) | `npm run db:migrate:deploy` |

### What We Do NOT Use in Production

- ❌ `prisma db push` — not a production migration strategy
- ❌ `prisma migrate dev` — development-only, creates migrations
- ❌ `prisma db reset` — destructive, development-only
- ❌ Manual SQL migrations — unless explicitly documented as an exception

### Migration History

- 24 migrations in `prisma/migrations/` (as of Step 34)
- All migrations are committed to Git and treated as **immutable** once applied to any shared environment
- Migration ordering is chronological by timestamp prefix
- The `migration_lock.toml` records the provider (`postgresql`)

### Schema Drift Detection

```bash
# Check if schema matches migration history
npm run db:validate              # Validates Prisma schema syntax
npm run db:migrate:status        # Shows applied vs pending migrations
npm run db:migrate:diff -- --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --script
```

---

## 2. Migration Process

### Creating a New Migration (Development)

```bash
# 1. Modify prisma/schema.prisma
# 2. Create and apply migration locally
npm run db:migrate:dev -- --name descriptive_migration_name

# 3. Inspect the generated SQL
cat prisma/migrations/<timestamp>_<name>/migration.sql

# 4. Test the migration
#    - Run application against migrated database
#    - Run tests: npm test

# 5. Commit the migration directory
git add prisma/migrations/<timestamp>_<name>/
git commit -m "migration: <description>"
```

### Reviewing a Migration

Before committing, verify:

- [ ] Migration SQL is readable and intentional
- [ ] No destructive operations without additive transition plan
- [ ] Enum changes preserve existing values (additive only, or documented transition)
- [ ] Foreign key changes use `RESTRICT` not `CASCADE` for user-facing entities
- [ ] Indexes are justified (coordinate with performance work)
- [ ] Data migrations are separated from schema migrations when non-trivial

### Testing a Migration

**Fresh database test** (all migrations from zero):

```bash
# In isolated test database
npx prisma migrate reset --force  # Only in isolated test DB!
npx prisma migrate deploy
npm test
```

**Upgrade test** (from representative prior state):

```bash
# Restore a snapshot of prior schema state (if available)
# Apply new migration
npx prisma migrate deploy
# Verify application behavior
npm test
```

### Deploying to Production

```bash
# 1. Review code changes (PR review)
# 2. Review migration SQL (in PR)
# 3. Validate in isolated environment (preview/staging)
npm run db:migrate:deploy

# 4. Ensure recovery conditions are acceptable
#    - Supabase PITR window is recent
#    - No active destructive operations

# 5. Deploy migration intentionally (via CI/CD or manual)
npm run db:migrate:deploy

# 6. Verify migration result
npm run db:migrate:status
npm run db:health

# 7. Deploy compatible application code
#    (Vercel deploy or git push)

# 8. Run smoke checks (Section 11)
```

---

## 3. Migration Status & Health Checks

### Commands

```bash
# Show applied/pending migrations
npm run db:migrate:status

# Validate Prisma schema
npm run db:validate

# Database connectivity + migration status + basic integrity
npm run db:health
```

### `db:health` Output

The `db:health` command checks:

- Database connectivity
- Migration status (all applied?)
- Prisma client compatibility (schema matches)
- Basic table existence for core models
- Organization boundary integrity (sample check)

Run `npm run db:health` after any migration deployment and as part of smoke checks.

### What to Look For

| Status | Meaning | Action |
|--------|---------|--------|
| `Database schema is up to date` | All migrations applied | ✅ Good |
| `X migrations pending` | Migrations not applied | Run `db:migrate:deploy` |
| `Drift detected` | Schema ≠ migrations ≠ DB | Investigate (Section 4) |
| Connection failed | Cannot reach DB | Check `DATABASE_URL`, network, Supabase status |

---

## 4. Failed Migration Procedure

### When `prisma migrate deploy` Fails

**DO NOT** immediately rerun blindly.

### Step-by-Step Response

```
1. STOP — do not run more commands yet
2. Read the full error output
3. Identify the migration that failed (shown in output)
4. Inspect Prisma migration state:
      npx prisma migrate status
   Check the `_prisma_migrations` table:
      SELECT * FROM "_prisma_migrations" ORDER BY "finished_at" DESC LIMIT 5;
5. Inspect database state:
      - Does the target table/column/index exist?
      - Is there a partial application?
6. Determine if migration committed or rolled back:
      - Prisma migrations are transactional per-migration
      - If failed mid-migration, it should be rolled back
      - But some operations (enum alterations, index creation) may leave artifacts
7. Resolve based on actual state:
      a) If rolled back cleanly: fix the migration SQL, regenerate (dev only), retry
      b) If partially applied: manually complete or revert the specific operation, then mark migration as applied/failed in `_prisma_migrations`
      c) If migration succeeded but later step failed: mark as applied, investigate next migration
8. ONLY resume normal deployment after verification:
      npm run db:migrate:status
      npm run db:health
      npm test (if possible)
```

### Marking a Migration as Applied (Recovery Only)

```sql
-- ONLY if you are certain the migration's effects exist in the database
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
VALUES ('<migration-id>', '<checksum>', NOW(), '<migration-name>', 'Manually marked as applied after recovery', NULL, NOW(), 1);
```

Get the `<migration-id>` and `<checksum>` from the migration directory's `migration.sql` (checksum is in the directory metadata or compute with `sha256sum migration.sql`).

### Common Failure Patterns

| Error | Likely Cause | Resolution |
|-------|--------------|------------|
| `P2003` FK violation | Data violates new constraint | Clean data first, then migrate |
| `P2002` Unique violation | Duplicate data for new unique index | Deduplicate data first |
| Enum value missing | Code uses value not in enum | Add value to enum in migration (additive) |
| `already exists` | Object created outside Prisma | Drop manually, then migrate |
| Timeout | Large table operation | Consider splitting migration |

---

## 5. Failed Application Deployment Procedure

### Scenario

Application code is broken, but database is intact.

### Response

```
1. Roll back application deployment (Vercel: revert to previous deployment)
2. PRESERVE the current database state — do NOT roll back the database
3. Determine compatibility:
   - Does the rolled-back application code work with the current database schema?
   - If migration was additive-only: usually compatible
   - If migration was destructive: may need forward-fix or database restore
4. If incompatible:
   - Option A: Forward-fix application code to work with current schema
   - Option B: Restore database from backup (Section 7) — LAST RESORT
5. Verify after rollback:
   - Sign in works
   - Dashboard loads
   - Core CRUD operations work
```

### Critical Rule

> **Do not automatically roll back the database merely because the application deployment failed.** Database rollback is a separate, higher-risk operation.

---

## 6. Data Corruption Response

### Scenario

Data is structurally valid but incorrect due to application behavior (e.g., bug in conversion logic, wrong status transition, cross-tenant leak).

### Response

```
1. STOP the faulty mutation path
   - Disable the feature flag / route / API if possible
   - Or deploy a hotfix that prevents further corruption

2. Identify affected records
   - Write a SELECT query to find anomalies
   - Scope to specific organization(s) where possible
   - Document the query and results

3. Determine safest repair approach
   - Can it be fixed with a targeted UPDATE?
   - Does it require a data migration script?
   - Is a database restore needed? (See Section 7)

4. Execute controlled repair
   - Use a server-side script (not client-facing API)
   - Require explicit environment confirmation
   - Log what was changed (organization, record IDs, before/after)
   - Operate on smallest safe scope (one org, one project, etc.)

5. Validate repaired records
   - Re-run identification query — should return zero
   - Run related tests
   - Check tenant boundaries

6. Document the incident
   - What happened
   - Root cause
   - Repair performed
   - Prevention for future
```

### Repair Script Template

```typescript
// scripts/repair-<issue>.ts
// - Server-side only
// - Requires explicit confirmation
// - Logs organization-scoped changes
// - Uses service-role Prisma client
// - Runs in transaction where possible
```

---

## 7. Database Restoration Procedure

### When to Restore

- Accidental destructive change (DROP, TRUNCATE, bad UPDATE)
- Failed migration that cannot be fixed forward
- Corruption beyond targeted repair

### Supabase Restoration Options

| Method | Availability | RPO | RTO | Notes |
|--------|--------------|-----|-----|-------|
| **Point-in-Time Recovery (PITR)** | Pro plan+ | ~1 min | Minutes | Best option if available |
| **Manual Backup Restore** | All plans | Daily | Hours | Supabase daily backups (retention: 7 days on Free, longer on Pro) |
| **pg_dump/pg_restore** | All plans | Manual | Hours | Requires manual execution |

### Restoration Steps (PITR — Preferred)

```
1. STOP further destructive operations
2. In Supabase Dashboard → Database → Backups:
   - Select "Point in Time Recovery"
   - Choose timestamp BEFORE the incident
   - Initiate restore to NEW database (not in-place)
3. Verify restored database:
   - Connect with Prisma
   - npm run db:migrate:status
   - npm run db:health
   - Run tenant integrity checks (Section 10)
4. Update application to point to restored database:
   - Update DATABASE_URL / DIRECT_URL in Vercel
   - Redeploy application
5. Run post-recovery smoke checks (Section 11)
```

### Restoration Steps (Manual Backup)

```
1. In Supabase Dashboard → Database → Backups:
   - Download the latest daily backup
   - Restore to a NEW database project
2. Follow steps 3-5 above
```

### Critical Notes

- **Never restore in-place** — always restore to a new database and switch the application
- **Storage & Auth are separate** — see Sections 8 & 9
- **Test the restore first** in a non-production environment if possible
- **RPO/RTO are best-effort** — see Section 12 for actual capabilities

---

## 8. Storage Recovery Considerations

### Relationship

```
Postgres (ProjectDocument records)
       │
       ├── storagePath → Supabase Storage object
       └── storageUrl  → Signed URL (ephemeral, regenerated on demand)
```

### Recovery Implications

| Scenario | Postgres State | Storage State | Action |
|----------|----------------|---------------|--------|
| DB restored, Storage intact | Restored | Current | Verify `storagePath` references exist; regenerate signed URLs on demand |
| DB restored, Storage deleted | Restored | Missing objects | Orphaned records → decide: delete records or re-upload |
| Storage restored, DB current | Current | Restored | Extra objects → run `npm run audit:storage -- --fix` to clean orphans |

### Key Points

- **No cross-system atomicity**: Database and Storage are separately managed
- **Signed URLs are ephemeral**: Regenerated on demand from `storagePath`
- **Audit command**: `npm run audit:storage` detects inconsistencies
- **Fix command**: `npm run audit:storage -- --fix` removes orphaned storage objects (use carefully)

### Post-Restoration Storage Verification

```bash
# Check for orphaned records (DB has record, Storage missing object)
npm run audit:storage

# Check for orphaned objects (Storage has object, no DB record)
npm run audit:storage -- --fix  # Review output before confirming
```

---

## 9. Auth & Configuration Recovery Considerations

### Separate Systems

A complete BusinessFlow environment requires:

| System | Recovery Mechanism |
|--------|-------------------|
| **Application Database** (Postgres) | Supabase PITR / Backup / pg_restore |
| **Supabase Storage** | Separate bucket restore (manual) |
| **Supabase Auth** (users, sessions, MFA) | Supabase Auth backup (Pro+) / Manual recreation |
| **Configuration/Secrets** (Vercel env vars) | Git / Vercel dashboard / Password manager |

### Auth Recovery

- **Users**: Supabase Auth users are NOT in the application database. `User.authUserId` references them.
- **Restoring Postgres alone does NOT restore Auth users**.
- **If Auth is corrupted**: Use Supabase Dashboard → Authentication → Users to inspect/recreate.
- **Password recovery**: Uses Supabase's built-in flow; ensure `NEXT_PUBLIC_SITE_URL` is correct.

### Configuration Recovery

- All secrets in Vercel Environment Variables
- `.env.example` documents required variables
- Rotate secrets if compromised: generate new → update Vercel → redeploy

---

## 10. Tenant Integrity Verification Checklist

**Run after ANY recovery procedure.**

### Minimum Verification Queries

```sql
-- 1. Organizations exist
SELECT count(*) FROM "Organization";

-- 2. Users map to memberships
SELECT u.id, u.email, count(m.*) as membership_count
FROM "User" u
LEFT JOIN "OrganizationMember" m ON m."userId" = u.id
GROUP BY u.id
HAVING count(m.*) = 0;  -- Should be zero for active users

-- 3. Projects under correct organization
SELECT p.id, p.name, p."organizationId", o.name as org_name
FROM "Project" p
JOIN "Organization" o ON o.id = p."organizationId";

-- 4. Clients under correct organization
SELECT c.id, c.name, c."organizationId", o.name as org_name
FROM "Client" c
JOIN "Organization" o ON o.id = c."organizationId";

-- 5. Tasks under correct project/organization
SELECT t.id, t.title, t."organizationId", t."projectId", p.name as project_name
FROM "Task" t
JOIN "Project" p ON p.id = t."projectId" AND p."organizationId" = t."organizationId";

-- 6. Documents under correct project/organization
SELECT d.id, d.name, d."organizationId", d."projectId", p.name as project_name
FROM "ProjectDocument" d
JOIN "Project" p ON p.id = d."projectId" AND p."organizationId" = d."organizationId";

-- 7. Activities correctly associated
SELECT a.id, a.type, a."organizationId", a."projectId", a."taskId", a."leadId", a."clientId"
FROM "Activity" a
WHERE a."organizationId" IS NOT NULL;

-- 8. AI records correctly scoped
SELECT * FROM "ProjectAIAnalysis" WHERE "organizationId" IS NULL;  -- Should be zero
SELECT * FROM "AIAnalysisFeedback" WHERE "organizationId" IS NULL; -- Should be zero
SELECT * FROM "AIConversation" WHERE "organizationId" IS NULL;     -- Should be zero
SELECT * FROM "AIAssistantTaskProposal" WHERE "organizationId" IS NULL; -- Should be zero

-- 9. Invitations/memberships coherent
SELECT i.*, m.role as member_role
FROM "OrganizationInvitation" i
LEFT JOIN "OrganizationMember" m ON m."organizationId" = i."organizationId" AND m."userId" = (
    SELECT id FROM "User" WHERE email = i.email
);
```

### Automated Check

```bash
# Run the health check which includes tenant integrity sampling
npm run db:health
```

---

## 11. Post-Recovery Smoke Checks

**Run after ANY recovery procedure before declaring success.**

### Functional Checks

| Area | Check |
|------|-------|
| Authentication | Sign in → email confirmation → password reset → sign out |
| Workspace | Create workspace → invite member → accept invitation → switch workspaces |
| Leads | Create → view → update status → convert to client |
| Clients | Create → view → update |
| Projects | Create → view → update status/priority |
| Tasks | Create → assign → update status → complete |
| Documents | Upload → view → download → delete → set primary brief |
| AI Intelligence | Analyze project with primary brief |
| AI Assistant | Start conversation → ask about project → create task proposal → approve |
| Search | Global search returns results |
| Activity | Feed shows recent actions |
| Dashboard | Shows correct metrics |
| Settings | Update profile → change password (reauth) → manage members |

### Organization Boundary Checks

- [ ] User only sees their organizations
- [ ] Project queries filtered by organization
- [ ] Task queries filtered by organization
- [ ] Document access authorized per organization
- [ ] AI analysis scoped to organization
- [ ] Assistant conversations scoped to organization
- [ ] Invitations only for user's organizations

---

## 12. Supabase Backup/Recovery Capabilities

> **Rule**: Never state capabilities that aren't confirmed by current infrastructure.

### What Is Verified

| Capability | Status | Details |
|------------|--------|---------|
| **Daily Backups** | ✅ Verified | Supabase takes daily backups on all plans |
| **Backup Retention (Free)** | ✅ Verified | 7 days on Free plan |
| **Backup Retention (Pro)** | ⚠️ Plan-dependent | Longer retention on paid plans (check current plan) |
| **Point-in-Time Recovery (PITR)** | ⚠️ Plan-dependent | Available on Pro plan and above; NOT on Free plan |
| **Manual Backup Download** | ✅ Verified | Can download backup from Dashboard |
| **Storage Backup** | ❌ Not included | Storage objects NOT in Postgres backup |
| **Auth Backup** | ⚠️ Plan-dependent | Auth export available on Pro+; not on Free |

### Current Project Configuration

- **Supabase Plan**: [CHECK CURRENT PLAN IN DASHBOARD]
- **PITR Available**: [YES/NO BASED ON PLAN]
- **Backup Retention**: [X DAYS BASED ON PLAN]
- **Last Verified**: [DATE]

### What This Means for BusinessFlow

| Scenario | Free Plan | Pro Plan |
|----------|-----------|----------|
| Accidental `DROP TABLE` 5 min ago | ❌ Cannot restore to 5 min ago | ✅ PITR to 5 min ago |
| Accidental `DROP TABLE` 2 days ago | ✅ Daily backup (if within 7 days) | ✅ Daily backup + PITR |
| Storage bucket deleted | ❌ No automated backup | ❌ No automated backup |
| Auth users corrupted | ❌ No automated backup | ⚠️ Auth export available |

### Action Required

1. **Check current Supabase plan** and update this table
2. **If on Free plan**: Document that PITR is NOT available; RPO = up to 24 hours (daily backup)
3. **Consider plan upgrade** if RPO < 24 hours is required
4. **Storage backup**: No automated solution; document manual process if critical

---

## 13. Recovery Limitations & Deferred Items

### Honest Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| No PITR on Free plan | Up to 24h data loss | Upgrade plan or accept risk |
| No automated Storage backup | Manual recovery needed | Document manual process |
| No automated Auth backup | Manual user recreation | Export user list periodically |
| No cross-system atomicity | DB/Storage/Auth may drift | Audit commands + manual reconciliation |
| No background job framework | Large data migrations risky | Use additive migration patterns |

### Deferred to Future Roadmap

- [ ] Automated backup verification (restore test to staging)
- [ ] Cross-system consistency monitoring
- [ ] Background job framework for large data migrations
- [ ] External monitoring/alerting for migration failures
- [ ] Multi-region deployment with replica promotion
- [ ] Formal RTO/RPO SLA documentation (requires Pro+ infrastructure)

---

## Quick Reference: Emergency Commands

```bash
# Migration status
npm run db:migrate:status

# Database health
npm run db:health

# Validate schema
npm run db:validate

# Apply production migrations
npm run db:migrate:deploy

# Storage audit
npm run audit:storage
npm run audit:storage -- --fix

# Full test suite
npm test

# Typecheck + lint
npm run typecheck && npm run lint
```

### Environment Variables for Recovery

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Session pooler (port 6543) for application runtime |
| `DIRECT_URL` | Direct connection (port 5432) for Prisma CLI/migrations |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin access for storage, auth admin, recovery scripts |
| `SEED_DATA_ENABLED` | **DANGEROUS** — only for controlled test DBs |

---

## Escalation

If recovery exceeds team capability:

1. Document current state (what's broken, what's been tried)
2. Contact Supabase Support (if on paid plan)
3. Consider professional PostgreSQL consulting for complex corruption
4. Preserve all evidence (logs, error messages, query results)

---

*Last updated: Step 34 implementation*
*Review quarterly or after any recovery incident*