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
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key

Do not commit `.env.local` or any credentials. In Supabase Auth settings, enable email/password sign-in and add `http://localhost:3000/auth/callback` to the allowed redirect URLs. Set the production callback URL there before deployment. No service-role key is required.

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
