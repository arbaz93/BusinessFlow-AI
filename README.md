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

- `DATABASE_URL`: PostgreSQL connection string used by the application runtime
- `DIRECT_URL`: PostgreSQL connection used by Prisma CLI migrations
- `NEXT_PUBLIC_SITE_URL`: canonical application URL used for authentication confirmation links (for example, `http://localhost:3000`)
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service-role key required for private document uploads and signed URLs
- `WORKSPACE_INVITATION_EXPIRY_DAYS`: optional invitation link lifetime from 1 to 90 days (defaults to 7)

Do not commit `.env.local` or any credentials. In Supabase Auth settings, enable email/password sign-in and allow `${NEXT_PUBLIC_SITE_URL}/auth/callback` and `${NEXT_PUBLIC_SITE_URL}/auth/callback/invitations/**` as redirect URLs. Invitation email is submitted through Supabase Auth when the server-side service-role key is configured and Supabase email delivery is available; otherwise owners can copy and share the generated invitation link. Set `NEXT_PUBLIC_SITE_URL` to your app origin (for example, `http://localhost:3000` locally or `https://your-domain.example` in production). For project documents, create a private storage bucket named `project-documents` in Supabase and keep the bucket private.

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

Prisma is configured for PostgreSQL in `prisma/schema.prisma`. It defines application profiles, organizations, and organization memberships; Supabase Auth remains the identity source.

After setting both database URLs, apply the initial schema and generate the client:

```bash
npx prisma generate
npx prisma migrate deploy
```

For local schema changes, use `npx prisma migrate dev --name <migration-name>`.

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

## Current Boundary

The Leads, Clients, Projects, Assistant, and Settings routes are protected placeholders. Their business operations, tasks, documents, AI processing, storage, and billing are not implemented yet.
