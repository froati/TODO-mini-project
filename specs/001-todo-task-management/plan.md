# Implementation Plan: Todo Task Management

**Branch**: `001-todo-task-management` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-todo-task-management/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Deliver CRUD-style task management (add, list, toggle completion, delete; title + priority
High/Medium/Low) as specified in [spec.md](./spec.md). Technical approach: a single Next.js App
Router project exposes REST-style API routes under `app/api/tasks/`, backed by Prisma ORM against
a local SQLite file (`dev.db`), with a singleton Prisma Client (`lib/prisma.ts`) and a
client-rendered page (`app/page.tsx`) consuming those routes. No external database server or
service is required.

## Technical Context

**Language/Version**: TypeScript (Strict Mode), Node.js (Next.js-managed runtime)

**Primary Dependencies**: Next.js (App Router), React, Prisma ORM (`@prisma/client` + `prisma` CLI), Tailwind CSS or CSS Modules for styling

**Storage**: SQLite, local file `prisma/dev.db`, accessed exclusively through Prisma Client

**Testing**: Manual verification via `quickstart.md` (browser + `npx prisma studio`) — no automated test framework is introduced for this feature (see research.md for rationale)

**Target Platform**: Web browser, served by the Next.js dev server (`npm run dev`, `localhost:3000`)

**Project Type**: Web application — single Next.js project combining API routes and UI (not a split frontend/backend)

**Performance Goals**: Not performance-critical (single local user); informal targets only — task creation perceived as instant (<10s per spec SC-001), list remains responsive with ≥100 tasks (spec SC-004)

**Constraints**: No external/managed database server (local SQLite file only, per user instruction and AGENTS.md); `pages/` directory MUST NOT be used; all API responses MUST use the standardized `{success, data}` / `{error}` JSON envelope; a single PrismaClient instance MUST be reused via `lib/prisma.ts`

**Scale/Scope**: Small — one entity (Task), four endpoints (list, create, update/toggle, delete), one page

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Checked against `.specify/memory/constitution.md` v1.0.0:

| Principle | Check | Result |
|---|---|---|
| I. Strict Type Definitions | Plan uses TypeScript Strict Mode throughout; Prisma generates typed models; no `any` planned in API routes, `lib/prisma.ts`, or UI | PASS |
| II. Standardized JSON Responses | All `app/api/tasks/**/route.ts` handlers return `{ success: true, data }` (200/201) or `{ error }` (400/404/500) per contract | PASS |
| III. Guaranteed Persistence | All Task reads/writes go through Prisma Client to `dev.db`; no in-memory array used as storage | PASS |
| IV. Prisma Singleton Pattern | `lib/prisma.ts` exports one cached PrismaClient instance (globalThis-guarded for dev hot-reload); all routes import from there | PASS |
| Tech stack constraints (App Router only, SQLite local file, no external DB server) | Confirmed by user input for this plan | PASS |

No violations — Complexity Tracking table is not needed.

**Post-Phase 1 re-check**: `data-model.md`, `contracts/tasks-api.md`, and `quickstart.md` (below)
introduce no new dependencies, storage mechanism, or response shape beyond what was checked above
— the JSON envelope in `contracts/tasks-api.md` matches Principle II exactly, and the Prisma
model in `data-model.md` matches Principle III/IV and AGENTS.md verbatim. Constitution Check
remains **PASS** after design.

## Project Structure

### Documentation (this feature)

```text
specs/001-todo-task-management/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── tasks-api.md     # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
mini-todo-sqlite/
├── prisma/
│   ├── schema.prisma        # Task model (title, completed, priority, timestamps)
│   └── dev.db                # SQLite file, created by `prisma migrate dev`
├── lib/
│   └── prisma.ts             # PrismaClient singleton (globalThis-cached)
├── app/
│   ├── api/
│   │   └── tasks/
│   │       ├── route.ts          # GET (list, newest first), POST (create)
│   │       └── [id]/
│   │           └── route.ts      # PATCH (toggle/update), DELETE
│   ├── layout.tsx             # Root layout
│   └── page.tsx                # Todo UI: list, add form, toggle, delete
├── .env                        # DATABASE_URL="file:./dev.db"
└── AGENTS.md
```

**Structure Decision**: Single Next.js project (App Router) per AGENTS.md's mandated directory
layout — API routes and UI live in the same `app/` tree; there is no separate backend/frontend
split since Next.js API routes already serve that role. This matches "Option 1: single project"
from the generic template, specialized to the Next.js/Prisma layout fixed by the project
constitution.

## Complexity Tracking

*No Constitution Check violations — this section is intentionally empty.*
