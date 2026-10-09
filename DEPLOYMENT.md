# BusinessFlow AI — Production Deployment Guide

This document describes the production configuration and deployment requirements for BusinessFlow AI on Vercel + Supabase.

---

## 1. Required Infrastructure

### Supabase Project
A production Supabase project is required with:
- **PostgreSQL database** (Supabase managed)
- **Auth** (email/password provider enabled)
- **Storage** (for project documents)

### Vercel Project
A Vercel project connected to this Git repository.

### Google AI Studio
A Google Cloud project with Gemini API access for AI features.

---

## 2. Environment Variables

### Public / Browser-Safe (NEXT_PUBLIC_*)
These are embedded in the client bundle. **Never put secrets here.**

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SITE_URL` | Canonical application URL for auth callbacks, password recovery, invitations | `https://app.example.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public) | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | `sb_publishable_...` |

### Server-Only Secrets
These **must never** be prefixed with `NEXT_PUBLIC_` and are only available in server-side code.

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection for Prisma runtime (session pooler, port 6543) | `postgresql://postgres.xyz:pass@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | PostgreSQL connection for Prisma CLI migrations (direct, port 5432) | `postgresql://postgres.xyz:pass@aws-0-region.pooler.supabase.com:5432/postgres` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (full admin access) | `eyJhbGciOiJ...` |
| `GEMINI_API_KEY` | Google Gemini API key | `AI...` |
| `GEMINI_MODEL` | Gemini model name (default: `gemini-2.5-flash`) | `gemini-2.5-flash` |
| `AI_PROVIDER` | AI provider (currently only `gemini`) | `gemini` |
| `WORKSPACE_INVITATION_EXPIRY_DAYS` | Invitation link lifetime 1-90 days (default: 7) | `7` |
| `SEED_DATA_ENABLED` | **Dangerous**: Enable seed in non-dev (default: false) | `false` |

### Variable Mapping by Environment

| Variable | Local (.env.local) | Vercel Preview | Vercel Production |
|----------|-------------------|----------------|-------------------|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://preview.vercel.app` | `https://app.example.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Same | Same | Same |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Same | Same | Same |
| `DATABASE_URL` | Local/dev DB | Preview DB | **Production DB** |
| `DIRECT_URL` | Local/dev DB | Preview DB | **Production DB** |
| `SUPABASE_SERVICE_ROLE_KEY` | Same | Same | **Production key** |
| `GEMINI_API_KEY` | Same | Same | **Production key** |

---

## 3. Supabase Production Configuration

### Auth
In Supabase Dashboard → Authentication → Settings:

1. **Enable Email/Password provider**
2. **Site URL**: Set to production `NEXT_PUBLIC_SITE_URL`
3. **Redirect URLs** (add all):
   - `${NEXT_PUBLIC_SITE_URL}/auth/callback`
   - `${NEXT_PUBLIC_SITE_URL}/auth/callback/invitations/**`
   - `${NEXT_PUBLIC_SITE_URL}/update-password`
4. **Email Templates**: Customize confirmation, recovery, invite emails if desired
5. **Disable "Confirm email"** only if you understand the security implications

### Storage
1. Create a **private** bucket named `project-documents`
2. **Do not make it public** — the application enforces private access with signed URLs
3. The bucket is auto-created on first upload if missing, but pre-creating is recommended
4. RLS policies are not needed — the application uses service-role for storage operations with application-level authorization

### Database
- Run migrations: `npx prisma migrate deploy` (or via CI/CD)
- The application uses Prisma with `@prisma/adapter-pg` for connection pooling
- Connection pooling: Use **Session Pooler** (port 6543) for `DATABASE_URL`
- Direct connection: Use **Direct Connection** (port 5432) for `DIRECT_URL`

---

## 4. Vercel Deployment

### Automatic Deployment
1. Connect Git repository to Vercel
2. Configure environment variables in Vercel Dashboard → Settings → Environment Variables
3. Set separate values for **Preview** and **Production** environments
4. Deploy

### Build Configuration
The build runs:
```bash
prisma generate && next build
```

### Vercel Settings (via `vercel.json`)
- Build command: `npm run build`
- Install command: `npm install`
- Framework: Next.js
- Function timeout: 60s for API routes, 30s for others
- Regions: `iad1` (US East)

### Security Headers (automatic via `next.config.ts` and `vercel.json`)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`

---

## 5. Pre-Deployment Checklist

Run these locally before deploying:

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Tests
npm test

# Prisma validation
npx prisma validate

# Production build (requires env vars)
npm run build
```

All must pass.

---

## 6. Post-Deployment Smoke Test

After deployment, verify:

### Authentication
- [ ] Sign up with new email
- [ ] Email confirmation link works
- [ ] Sign in works
- [ ] Password reset: request → email → set new password → sign in with new password
- [ ] Sign out works

### Workspace / Organization
- [ ] Create new workspace (onboarding)
- [ ] Invite member → member accepts invitation
- [ ] Switch between workspaces

### Core CRUD
- [ ] Create lead → view → update status → convert to client
- [ ] Create client → view → update
- [ ] Create project → view → update status/priority
- [ ] Create task → assign → update status → complete
- [ ] Upload document → view → download → delete
- [ ] Set primary project brief

### AI Features
- [ ] AI Project Intelligence: analyze a project with a primary brief
- [ ] AI Assistant: start conversation → ask about project → create task proposal → approve

### Data Integrity
- [ ] Global search returns results
- [ ] Activity feed shows recent actions
- [ ] Dashboard shows correct metrics

### Settings
- [ ] Update profile
- [ ] Change password (reauthentication)
- [ ] Manage members

---

## 7. Production Safety Guards

### Seed Protection
The `db:seed` and `db:reset-dev` scripts are **blocked in production** by multiple checks:
- `NODE_ENV=production` → blocked
- `VERCEL=1` → blocked
- `VERCEL_ENV=production` → blocked
- Remote database without `SEED_DATA_ENABLED=true` → blocked

### Database Protection
- `db:reset-dev` refuses to run against non-local databases
- Production deployments never invoke seed scripts automatically

### Secret Hygiene
- No secrets in `NEXT_PUBLIC_*` variables
- No secrets in client bundles
- No secrets logged (structured logging avoids sensitive fields)
- `.env*` files in `.gitignore`

---

## 8. Troubleshooting

### Build Fails: "Supabase environment variables are not configured"
Ensure all required env vars are set in Vercel for the target environment.

### Auth Callbacks Fail: "Set NEXT_PUBLIC_SITE_URL"
Ensure `NEXT_PUBLIC_SITE_URL` matches the deployed URL exactly (including protocol).

### AI Features Return "AI_NOT_CONFIGURED"
Ensure `GEMINI_API_KEY` and `GEMINI_MODEL` are set in server environment.

### Storage Upload Fails: "Document storage is not configured"
Ensure `SUPABASE_SERVICE_ROLE_KEY` is set and the `project-documents` bucket exists and is private.

### Database Connection Fails
- Verify `DATABASE_URL` uses session pooler (port 6543)
- Verify `DIRECT_URL` uses direct connection (port 5432)
- Check Supabase connection pooling is enabled

---

## 9. Maintenance

### Database Migrations

```bash
# Local development (creates and applies migration)
npm run db:migrate:dev -- --name <migration-name>

# Production (applies reviewed migrations)
npm run db:migrate:deploy

# Check migration status
npm run db:migrate:status

# Validate Prisma schema
npm run db:validate
```

### Database Health & Validation

```bash
# Full database health check (connectivity, migrations, tenant integrity, Prisma compatibility)
npm run db:health

# Migration validation (local databases only)
npm run db:migrate:diff  # Check drift between migrations and schema
```

### Updating Dependencies

```bash
npm update
npm run typecheck
npm run lint
npm test
npm run build
```

### Rotating Secrets

1. Generate new keys in Supabase / Google AI Studio
2. Update in Vercel environment variables
3. Redeploy

---

## 10. Migration & Recovery

See **[docs/operations/recovery-runbook.md](docs/operations/recovery-runbook.md)** for comprehensive procedures covering:

- Migration process (create, review, test, deploy)
- Failed migration response
- Failed application deployment response
- Data corruption repair
- Database restoration (PITR, backup restore)
- Storage recovery considerations
- Auth/configuration recovery
- Tenant integrity verification
- Post-recovery smoke checks
- Supabase backup/recovery capabilities (plan-dependent)

---

## 11. Deferred to Future Roadmap

The following remain deferred beyond Step 34:

- **Automated backup verification** (restore test to staging)
- **Cross-system consistency monitoring** (DB + Storage + Auth)
- **Background job framework** for large data migrations
- **External monitoring/alerting** for migration failures
- **Multi-region deployment** with replica promotion
- **Formal RTO/RPO SLA documentation** (requires Pro+ infrastructure)

---

## 12. Quick Reference

### Key Files

- `lib/env.ts` — Centralized environment validation
- `next.config.ts` — Next.js production config & security headers
- `vercel.json` — Vercel deployment config
- `package.json` — Build scripts, engines
- `.env.example` — Template for all required variables
- `prisma/schema.prisma` — Database schema
- `prisma/seed/env-guard.ts` — Seed safety guards
- `lib/db/health.ts` — Database health check utility
- `docs/operations/recovery-runbook.md` — Migration & recovery procedures

### Commands

```bash
npm run dev                 # Local development
npm run build               # Production build (includes prisma generate)
npm run typecheck           # TypeScript check
npm run lint                # ESLint
npm test                    # Unit tests
npm run db:generate         # Prisma generate
npm run db:migrate:dev      # Create + apply migration (development)
npm run db:migrate:deploy   # Apply reviewed migrations (production)
npm run db:migrate:status   # Check migration status
npm run db:migrate:diff     # Check schema/migration drift
npm run db:validate         # Validate Prisma schema
npm run db:seed             # Seed development database (guarded)
npm run db:reset-dev        # Reset + seed development database (guarded)
npm run db:health           # Full database health check
npm run audit:storage       # Check storage/database consistency
```