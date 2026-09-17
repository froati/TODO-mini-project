---

description: "Task list template for feature implementation"
---

# Tasks: Todo Task Management

**Input**: Design documents from `/specs/001-todo-task-management/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not included — no automated test framework was requested for this feature (see research.md § 1); validation is manual via quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single Next.js App Router project (per plan.md § Project Structure) — `app/`, `lib/`, `prisma/` at repository root. No separate `backend/`/`frontend/` split.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add Prisma to the existing Next.js project (already scaffolded via `create-next-app`).

- [X] T001 Install Prisma dependencies: `npm install prisma @prisma/client`
- [X] T002 Initialize Prisma with a SQLite datasource: `npx prisma init --datasource-provider sqlite`, then confirm/set `DATABASE_URL="file:./dev.db"` in `.env` (files: `prisma/schema.prisma`, `.env`) — depends on T001

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core Task schema, migration, and Prisma Client singleton that every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 [P] Define the `Task` model in `prisma/schema.prisma` per data-model.md: `id Int @id @default(autoincrement())`, `title String`, `completed Boolean @default(false)`, `priority String @default("Medium")` (one of `"High" | "Medium" | "Low"`), `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt` — depends on T002
- [X] T004 Run the initial migration: `npx prisma migrate dev --name init_task`, creating `prisma/dev.db` and `prisma/migrations/` — depends on T003
- [X] T005 [P] Create the Prisma Client singleton in `lib/prisma.ts`, caching the instance on `globalThis` outside production so Next.js dev-mode hot reload never creates a second `PrismaClient` (research.md § 2; Constitution Principle IV) — depends on T001

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Add and view tasks (Priority: P1) 🎯 MVP

**Goal**: A user can create a task with a title and priority, and see all tasks in a single list, newest first.

**Independent Test**: Add one or more tasks with a title and priority; confirm each appears in the list with its title/priority, newest first, and that a blank title is rejected (spec.md § User Story 1).

### Implementation for User Story 1

- [X] T006 [US1] Implement `GET` and `POST` handlers in `app/api/tasks/route.ts` per contracts/tasks-api.md:
  - `GET`: return `{ success: true, data: Task[] }` ordered by `createdAt` descending (FR-005); return `data: []` (not an error) when no tasks exist (FR-009)
  - `POST`: read `{ title, priority? }`; if `title` is missing/blank/whitespace-only, return `400 { error: "title is required" }` (FR-002); if `priority` is provided and is not exactly `"High"`, `"Medium"`, or `"Low"`, return `400 { error: "invalid priority" }` (FR-004); if `priority` is omitted, default to `"Medium"` (FR-003); on success return `201 { success: true, data: Task }`
  - depends on T003, T004, T005
- [X] T007 [US1] Implement the task list + creation form in `app/page.tsx`: on load, `fetch('/api/tasks')` and render each task's title, priority, and completion state (newest first, exactly as returned); show an empty-state message when `data` is `[]` (FR-009); render a form with a title input and a priority select (`High`/`Medium`/`Low`, defaulting to `Medium`) that `POST`s to `/api/tasks` and prepends the created task on success; show an inline error and create nothing when the title is blank (spec.md Edge Cases) — depends on T006

**Checkpoint**: User Story 1 is fully functional and independently testable (quickstart.md scenarios 1-3, 6).

---

## Phase 4: User Story 2 - Toggle task completion (Priority: P2)

**Goal**: A user can mark a task done or not done from the list, without it moving or disappearing.

**Independent Test**: Toggle a task with `completed = false` and confirm it now shows as done; toggle it again and confirm it returns to not-done; confirm other tasks and the toggled task's list position are unaffected (spec.md § User Story 2).

### Implementation for User Story 2

- [X] T008 [US2] Implement the `PATCH` handler in `app/api/tasks/[id]/route.ts` per contracts/tasks-api.md: read `{ completed }`; if it is not a boolean, return `400 { error: "completed must be a boolean" }`; if no task matches the `id` route param, return `404 { error: "task not found" }`; on success, update only `completed` (and `updatedAt`) and return `200 { success: true, data: Task }` (FR-006) — depends on T003, T004, T005
- [X] T009 [US2] Add a completion toggle control to each task item in `app/page.tsx`: on click, call `PATCH /api/tasks/{id}` with the flipped `completed` value and update that task's visual state in place; the task MUST NOT move, hide, or reorder within the list (Clarification, Session 2026-09-16; FR-006) — depends on T007, T008

**Checkpoint**: User Stories 1 AND 2 both work independently (quickstart.md scenario 4).

---

## Phase 5: User Story 3 - Delete a task (Priority: P3)

**Goal**: A user can permanently remove any task, completed or not.

**Independent Test**: Create a task and delete it — confirm it no longer appears; mark a task completed and delete it — confirm it is removed the same way (spec.md § User Story 3).

### Implementation for User Story 3

- [X] T010 [US3] Implement the `DELETE` handler in `app/api/tasks/[id]/route.ts` per contracts/tasks-api.md: if no task matches the `id` route param, return `404 { error: "task not found" }`; otherwise delete it regardless of `completed` status (FR-007) and return `200 { success: true, data: { id } }` — depends on T008 (same file)
- [X] T011 [US3] Add a delete control to each task item in `app/page.tsx`: on click, call `DELETE /api/tasks/{id}` and remove that task from the rendered list on success, identically whether it was completed or not (FR-007) — depends on T009, T010

**Checkpoint**: All three user stories are independently functional (quickstart.md scenario 5).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Refinements that span all user stories.

- [X] T012 [P] Style the task list in `app/page.tsx` / `app/globals.css` so priority (`High`/`Medium`/`Low`) and completion state are each visually distinguishable at a glance (e.g., color/label per priority, strikethrough or checkmark for completed) — satisfies SC-003 — depends on T007, T009
- [X] T013 Run the full `specs/001-todo-task-management/quickstart.md` validation (all 6 scenarios plus the `npx prisma studio` persistence check) and confirm every scenario passes (SC-002) — depends on T011, T012

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion. No dependency on other stories.
- **User Story 2 (Phase 4)**: Depends on Foundational completion; its UI task (T009) also depends on T007 (same file, `app/page.tsx`) and its API task (T010→ see below) shares a file with US3.
- **User Story 3 (Phase 5)**: Depends on Foundational completion; T010 shares `app/api/tasks/[id]/route.ts` with T008 (US2), and T011 shares `app/page.tsx` with T009 (US2) — so in practice US3 is implemented after US2 even though it has no *conceptual* dependency on it.
- **Polish (Phase 6)**: Depends on all three user stories being complete.

### Within Each User Story

- API route handler before the UI control that calls it.
- Story complete (checkpoint) before moving to the next priority.

### Parallel Opportunities

- T003 and T005 (Phase 2) can run in parallel — different files (`prisma/schema.prisma` vs `lib/prisma.ts`).
- T012 (Phase 6 styling) can run in parallel with T013 only in the sense that styling could start before the final quickstart run, but T013 should be the last task executed since it validates everything above it.
- Because this feature has only two route files (`app/api/tasks/route.ts`, `app/api/tasks/[id]/route.ts`) and one page (`app/page.tsx`), most story-level tasks are sequential by file rather than parallel — this is expected for a small, single-page feature.

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch these two together once T001/T002 are done — different files:
Task: "Define the Task model in prisma/schema.prisma per data-model.md"
Task: "Create the Prisma Client singleton in lib/prisma.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T005) - CRITICAL, blocks all stories
3. Complete Phase 3: User Story 1 (T006-T007)
4. **STOP and VALIDATE**: Run quickstart.md scenarios 1-3 and 6 independently
5. Demo: add tasks with priorities, see them listed newest-first

### Incremental Delivery

1. Setup + Foundational → Prisma/SQLite ready
2. Add User Story 1 → Validate (quickstart scenarios 1-3, 6) → MVP demo
3. Add User Story 2 → Validate (quickstart scenario 4) → demo toggle
4. Add User Story 3 → Validate (quickstart scenario 5) → demo delete
5. Polish (T012-T013) → full quickstart + Prisma Studio persistence check

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No test tasks were generated — see research.md § 1 for why (manual verification via quickstart.md instead)
- Because both `app/api/tasks/[id]/route.ts` (PATCH then DELETE) and `app/page.tsx` (list → toggle control → delete control) are edited across US2 and US3, implement those two stories in order (P2 then P3) rather than in parallel
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently

## Implementation Notes (added post-implementation)

- **Prisma major-version drift**: `npm install prisma@latest` initially resolved to `8.0.0-rc.15`, a pre-release with a completely different, cloud/Postgres-first CLI (no `migrate`/`studio`/`generate` as classic commands, no SQLite target in `orm init`). Tried pinning to `prisma@7.10.0` next — its classic commands exist, but Prisma Studio in that line **does not support the SQLite `file:` protocol at all** (only network DB URLs), which blocks the GUIDELINE.md persistence-verification step outright. Settled on the last Prisma 6.x release, `prisma@6.19.3`, which fully supports classic SQLite + `migrate dev` + `studio` + implicit `.env` loading, matching AGENTS.md exactly with zero workarounds.
- **Final schema/config**: `prisma/schema.prisma` uses the plain classic form — `datasource db { provider = "sqlite"; url = env("DATABASE_URL") }` and `generator client { provider = "prisma-client-js" }` — verbatim per AGENTS.md § 4. `lib/prisma.ts` is a plain `new PrismaClient()` singleton (globalThis-cached); no driver adapter package is used or needed.
- **`.env`**: `DATABASE_URL="file:./dev.db"` (per AGENTS.md § 5), which under classic Prisma resolves relative to `prisma/schema.prisma`'s directory, landing the file at `prisma/dev.db` — matching AGENTS.md's directory structure without any path adjustment.
- No `prisma.config.ts`/`prisma7.config.ts` file is needed or present — Prisma 6.19.3 auto-loads `.env` the classic way.
