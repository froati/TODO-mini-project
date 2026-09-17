<!--
Sync Impact Report
- Version change: [TEMPLATE] → 1.0.0 (initial ratification)
- Modified principles: n/a (first adoption)
- Added sections:
  - Core Principles: I. Strict Type Definitions, II. Standardized JSON Responses,
    III. Guaranteed Persistence, IV. Prisma Singleton Pattern
  - Technology Stack & Architecture Constraints
  - Development Workflow & Commands
  - Governance
- Removed sections: none (replaced placeholder scaffold)
- Deferred TODOs: none — all values derived from AGENTS.md
-->

# mini-todo-sqlite Constitution

## Core Principles

### I. Strict Type Definitions
All variables, function arguments, return values, and API payloads MUST carry explicit
interfaces/types. The `any` type MUST NOT be used anywhere in the codebase. TypeScript
Strict Mode MUST remain enabled in `tsconfig.json`.
Rationale: Type ambiguity in a small CRUD app is avoidable entirely; strict typing catches
schema/payload mismatches between Prisma, API routes, and the UI at compile time instead of
at runtime.

### II. Standardized JSON Responses
Every API Route MUST return a consistent JSON response shape for both success and failure:
- Success (`200`, `201`): `{ "success": true, "data": ... }` (or an equivalent explicit data
  object documented in the route).
- Failure (`400`, `404`, `500`): `{ "error": "<message>" }`.
Rationale: Consistent envelopes let the client UI handle every endpoint with one parsing
path and make failures unambiguous during debugging.

### III. Guaranteed Persistence
Application state MUST NOT be held in transient in-memory arrays or module-level variables
as a substitute for storage. All Task data MUST be persisted through Prisma Client to the
local SQLite file (`dev.db`).
Rationale: The core learning objective of this project is verifying real persistence; any
in-memory shortcut defeats that goal and silently loses data on server restart.

### IV. Prisma Singleton Pattern
Code MUST always reuse the single PrismaClient instance exported from `lib/prisma.ts`.
New `PrismaClient()` instances MUST NOT be constructed elsewhere.
Rationale: Next.js dev-mode hot-reloading creates multiple module instances; without a
singleton this exhausts SQLite connections and produces intermittent, hard-to-reproduce
errors.

## Technology Stack & Architecture Constraints

- **Framework**: Next.js, App Router only (`app/`) — the `pages/` directory MUST NOT be used.
- **Language**: TypeScript in Strict Mode.
- **ORM**: Prisma ORM.
- **Database**: SQLite via a local file (`dev.db`), connected through `DATABASE_URL` in `.env`
  (`file:./dev.db`). No external/managed database server is required or permitted for this
  project.
- **Styling**: Tailwind CSS or CSS Modules.
- **Directory structure** MUST follow:
  ```text
  mini-todo-sqlite/
  ├── prisma/
  │   ├── schema.prisma
  │   └── dev.db
  ├── lib/
  │   └── prisma.ts
  ├── app/
  │   ├── api/
  │   │   └── tasks/
  │   │       ├── route.ts        # GET (list, newest first), POST (create)
  │   │       └── [id]/
  │   │           └── route.ts    # PATCH (toggle/update), DELETE
  │   ├── layout.tsx
  │   └── page.tsx
  └── .env
  ```
- **Data model** (`prisma/schema.prisma`) MUST define `Task` with at minimum: `id` (autoincrement
  PK), `title` (String), `completed` (Boolean, default `false`), `priority` (String, default
  `"Medium"`, one of `"High" | "Medium" | "Low"`), `createdAt` (DateTime, default now),
  `updatedAt` (DateTime, auto-updated).

## Development Workflow & Commands

- Dev server: `npm run dev`
- Create & apply a migration: `npx prisma migrate dev --name <migration_name>`
- Regenerate Prisma Client: `npx prisma generate`
- Inspect data: `npx prisma studio`
- Schema or data-model changes MUST be followed by a migration before being considered
  complete — editing `schema.prisma` without migrating leaves `dev.db` out of sync with
  Principle III.

## Governance

This constitution supersedes ad-hoc conventions for this project. All specs, plans, and
implementation work produced via the Spec Kit workflow (`/speckit-specify`, `/speckit-plan`,
`/speckit-tasks`, `/speckit-implement`) MUST comply with the principles and constraints above;
any deviation MUST be explicitly justified in the relevant `plan.md`'s Constitution Check
section.

**Amendment procedure**: Propose changes via `/speckit-constitution` with the specific
principle or section to change and the rationale. Update the version per semantic
versioning (MAJOR: incompatible principle removal/redefinition; MINOR: new principle or
materially expanded guidance; PATCH: clarification/wording only) and record the change in
the Sync Impact Report at the top of this file.

**Compliance review**: Every `/speckit-plan` run MUST verify its design against these
principles before proceeding to task generation.

**Version**: 1.0.0 | **Ratified**: 2026-09-16 | **Last Amended**: 2026-09-16
