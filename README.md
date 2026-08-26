# Family Platform

A modular family organization SaaS built for shared schedules, meals, groceries, chores, budgets, chat, notes and notifications.

## Termux-safe architecture

The original project used Prisma 5.19's native Rust query engine. That engine does not provide a working Android/Termux target in the project snapshot. This version uses Prisma's Rust-free client engine with the PostgreSQL JavaScript driver adapter, so the application runtime does not depend on an Android-specific Prisma query-engine binary. Prisma documents this architecture as generally available from v6.16.0.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Better Auth
- Prisma 6.19 + Rust-free client engine
- PostgreSQL + `pg`
- TanStack Query
- Zod
- Framer Motion
- Recharts

## 1. Install on Termux

```bash
pkg update -y
pkg install nodejs-lts git unzip -y
node -v
npm -v
```

Extract and enter the project:

```bash
unzip family-platform-fixed.zip
cd family-platform
```

Install dependencies:

```bash
npm install --no-audit --no-fund
```

## 2. Environment

```bash
cp .env.example .env
nano .env
```

Set at minimum:

```env
DATABASE_URL="your-postgresql-connection-string"
AUTH_SECRET="a-long-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Google OAuth, Redis, S3/R2 and Resend are optional until those features are enabled.

## 3. Generate Prisma client

```bash
npm run db:generate
```

This generates the client under `generated/prisma` and does not ship the old Rust query-engine binary.

## 4. Create/update the database

For a new database:

```bash
npm run db:push
```

If the Prisma CLI itself reports an Android schema-engine error, do not switch back to Prisma 5.19. The runtime fix is already in place; the remaining issue is the local migration CLI. In that case, run the database push from a supported desktop/CI environment against the same PostgreSQL URL, then return to Termux for development.

## 5. Start the app

```bash
npm run dev -- --webpack
```

Open:

```text
http://localhost:3000
```

## Authentication

The app now has:

- Email/password sign-up
- Email/password sign-in
- Server-side session protection
- Automatic first-family creation for a new account
- Owner membership creation
- Default Nigeria timezone/currency for the first family
- Protected grocery API access

Google OAuth is optional and only activates when both Google environment variables are present.

## Current feature state

The architecture and routes for all major modules are present. Calendar, meal planning, grocery, chores, budget, chat, notes, notifications and settings currently have module foundations; they are not falsely presented as complete features.

The next implementation work is feature-by-feature database CRUD and UI, followed by real-time chat, notifications, permissions, testing and deployment.
