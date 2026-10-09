# BusinessFlow AI

BusinessFlow AI is an AI-powered project and client operations platform for digital and creative agencies.

This repository contains the BusinessFlow AI foundation, Supabase email/password authentication, first-workspace onboarding, and protected application routes. Business modules remain later vertical slices.

## Tech Stack

- Next.js 16 with the App Router
- TypeScript with strict mode
- Tailwind CSS 4
- shadcn/ui conventions
- PostgreSQL and Prisma ORM 7
- Supabase Auth with cookie-based App Router sessions
- Zod for form and environment validation
- npm, Git, and Vercel-compatible project structure

## Prerequisites

Use Node.js 20.9 or newer and npm 10 or newer. The foundation was created and validated with Node.js 24 and npm 11.

A PostgreSQL connection is not required to view the foundation shell. It is required before running Prisma database commands.

## Installation

```bash
npm install
```

## Environment Setup

Create a local environment file from the template:

```bash
cp .env.local.example .env.local
```

Configure these values before using authentication or database-backed routes:

- `DATABASE_URL`: PostgreSQL connection string used by the application runtime (session pooler, port 6543)
- `DIRECT_URL`: PostgreSQL connection used by Prisma CLI migrations (direct, port 5432)
- `NEXT_PUBLIC_SITE_URL`: canonical application URL used for authentication confirmation links (for example, `http://localhost:3000`)
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service-role key required for private document uploads and signed URLs
- `GEMINI_API_KEY`: Google Gemini API key for AI Project Intelligence and Assistant
- `GEMINI_MODEL`: Gemini model name (default: `gemini-2.5-flash`)
- `WORKSPACE_INVITATION_EXPIRY_DAYS`: optional invitation link lifetime from 1 to 90 days (defaults to 7)

Do not commit `.env.local` or any credentials. In Supabase Auth settings, enable email/password sign-in and allow `${NEXT_PUBLIC_SITE_URL}/auth/callback` and `${NEXT_PUBLIC_SITE_URL}/auth/callback/invitations/**` as redirect URLs. Invitation email is submitted through Supabase Auth when the server-side service-role key is configured and Supabase email delivery is available; otherwise owners can copy and share the generated invitation link. Set `NEXT_PUBLIC_SITE_URL` to your app origin (for example, `http://localhost:3000` locally or `https://your-domain.example` in production). For project documents, create a private storage bucket named `project-documents` in Supabase and keep the bucket private.

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete production deployment instructions.

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

Prisma is configured for PostgreSQL in `prisma/schema.prisma`. It defines application profiles, organizations, and organization memberships; Supabase Auth remains the identity source.

After setting both database URLs, apply the initial schema and generate the client:

```bash
npm run db:generate
npm run db:migrate:deploy
```

For local schema changes, use `npm run db:migrate:dev -- --name <migration-name>`.

### Migration Commands

| Command | Purpose | Environment |
|---------|---------|-------------|
| `npm run db:migrate:dev -- --name <name>` | Create + apply migration | Development |
| `npm run db:migrate:deploy` | Apply reviewed migrations | Production/CI |
| `npm run db:migrate:status` | Check applied/pending migrations | Any |
| `npm run db:migrate:diff` | Check schema/migration drift | Development |
| `npm run db:validate` | Validate Prisma schema syntax | Any |
| `npm run db:health` | Full health check (connectivity, migrations, tenant integrity, Prisma) | Any |

### Development Seed Data

BusinessFlow includes a deterministic seed script that populates a local development database with realistic demo data across all business modules (Leads, Clients, Projects, Tasks, Documents, AI analysis, Activity, and Assistant conversations).

**Production safety:** The seed script performs a multi-layer environment check and will refuse to run against production databases. It checks `NODE_ENV`, Vercel environment metadata, and database URL heuristics. Production deployments never invoke the seed script automatically.

#### Running the Seed

```bash
npm run db:seed
```

This creates a demo workspace named "Demo Workspace" with:

- 6 Leads across all statuses (NEW, CONTACTED, QUALIFIED, PROPOSAL_SENT, WON, LOST)
- 3 Clients (2 ACTIVE, 1 INACTIVE)
- 5 Projects covering all statuses (PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED)
- 6 Tasks covering different states (overdue, in-progress, blocked, completed, no due date, upcoming)
- 3 Documents (Project Briefs and design assets)
- 1 AI analysis with feedback
- 10 Activity records following the canonical Activity system
- 1 AI Assistant conversation with 4 messages

**Demo Auth users:** The seed script creates application-level User records with synthetic `authUserId` values. To use the demo workspace, you must manually create matching Supabase Auth users in the Supabase Dashboard:

- **Owner:** `demo-owner@example.test` / `DemoPass123!` (authUserId: `demo_owner_auth_uid`)
- **Member:** `demo-member@example.test` / `DemoPass123!` (authUserId: `demo_member_auth_uid`)

**Important:** Demo data is clearly synthetic and uses `.example.test` domains. It is never committed with real customer data.

#### Resetting the Development Database

To wipe all data and re-seed from scratch:

```bash
npm run db:reset-dev
```

This is a **destructive** operation that only runs against local databases. It will refuse to run against any remote Supabase project.

#### Environment Separation

- **Development:** Local database — seed is allowed
- **Test:** Test database/fixtures — seed is allowed, test fixtures are separate from demo data
- **Preview/Staging:** Seed is not invoked automatically during Vercel deployment
- **Production:** Seed is blocked by environment guards; production build never runs seed

#### Test Fixtures vs Demo Data

Automated tests use isolated in-memory fixtures and mocked data (see `tests/`). They do NOT depend on the demo seed data. Demo data is only for manual development and UI exploration.

## Project documents

Project documents are stored in a private Supabase Storage bucket named `project-documents`. The bucket is created private on first upload and uploads are rejected if the bucket is public. Files are never publicly accessible: every download or view request is authorized server-side against the current workspace and project, and a short-lived signed URL (10 minutes) is generated only after authorization. Storage paths are server-generated as `organizations/{organizationId}/projects/{projectId}/documents/{documentId}/{sanitized-file-name}`; client-supplied storage paths are never trusted.

Uploads are validated server-side: supported types are PDF, DOCX, TXT, MD, CSV, PNG, JPG, GIF, and WebP; the reported MIME type must match the file extension; the file content signature is checked against the extension; and files are limited to 20 MB. Uploads first write the storage object, then persist the database record in a transaction; if the database save fails, the storage object is cleaned up. Deleting a document removes the storage object (using the path from the authorized database record) before removing the record, and reports truthful errors when either step fails.

A project may have at most one primary Project Brief, enforced by a partial unique index. Deleting the primary brief does not promote another brief; AI analysis then reports that no current primary source is available.

To check storage and database consistency (orphaned objects, records without objects, malformed paths), run:

```bash
npm run audit:storage
```

Add `--fix` to remove orphaned storage objects that have no matching database record.

## Workspace invitations

Workspace owners can invite members from **Settings → Members**. Invitation links use 256-bit random tokens; only their SHA-256 hashes are stored. Links expire after seven days by default. Set `WORKSPACE_INVITATION_EXPIRY_DAYS` to an integer from 1 to 90 to change that lifetime. Invited users must authenticate with a verified email matching the invitation before membership is created. When Supabase email delivery is unavailable, the owner can copy and share the invitation link from the Members page.

## Build

```bash
npm run lint
npm run build
```

## Project Structure

- `app/`: App Router routes and the application shell
- `components/ui/`: shadcn/ui-compatible reusable UI primitives
- `lib/`: shared utilities, environment validation, actions, services, and integrations as later phases add them
- `prisma/`: PostgreSQL schema and migrations
- `public/`: static assets

Auth helpers live in `lib/auth/`, Supabase clients in `lib/supabase/`, and protected application routes under `app/(application)/`.

## Migration & Recovery

See [docs/operations/recovery-runbook.md](docs/operations/recovery-runbook.md) for comprehensive migration and recovery procedures including:
- Migration process and safety guidelines
- Failed migration response
- Database restoration procedures
- Storage and Auth recovery considerations
- Tenant integrity verification
- Post-recovery smoke checks
- Supabase backup/recovery capabilities

## Current Boundary

The Leads, Clients, Projects, Assistant, and Settings routes are protected placeholders. Their business operations, tasks, documents, AI processing, storage, and billing are not implemented yet.