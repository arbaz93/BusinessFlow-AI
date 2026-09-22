# BusinessFlow AI

BusinessFlow AI is an AI-powered project and client operations platform for digital and creative agencies.

This repository currently contains **Phase 0: project foundation only**. Authentication, business records, AI workflows, and multi-tenant behavior are intentionally not implemented yet.

## Tech Stack

- Next.js 16 with the App Router
- TypeScript with strict mode
- Tailwind CSS 4
- shadcn/ui conventions
- PostgreSQL and Prisma ORM 7
- Supabase configuration prepared for later Auth and Storage phases
- Zod for environment and future input validation
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
cp .env.example .env.local
```

Fill in credentials only when the related integration is being developed:

- `DATABASE_URL`: PostgreSQL connection string for Prisma
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key
- `GEMINI_API_KEY`: reserved for the later AI integration phase
- `AI_PROVIDER`: currently defaults to `gemini`

Do not commit `.env.local` or any credentials. Blank values are accepted by the foundation shell.

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

Prisma is configured for PostgreSQL in `prisma/schema.prisma`, with connection settings in `prisma.config.ts`. No application tables are defined in Phase 0.

After setting `DATABASE_URL`, use the following commands as the schema evolves:

```bash
npx prisma generate
npx prisma migrate dev --name initial
```

The database connection has not been claimed as tested until a real PostgreSQL URL is supplied.

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

Future architecture areas such as `app/(auth)`, `app/(dashboard)`, `lib/actions`, `lib/services`, `lib/auth`, `lib/ai`, and `lib/storage` are intentionally not populated until their respective phases begin.

## Phase 0 Boundary

This phase stops at the technical foundation. It does not include Supabase authentication, signup, login, organizations, memberships, leads, clients, projects, tasks, documents, AI processing, Gemini integration, or dashboard business metrics.
