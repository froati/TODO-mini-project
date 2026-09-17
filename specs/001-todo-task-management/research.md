# Phase 0 Research: Todo Task Management

## 1. Automated testing approach

- **Decision**: No automated test framework is introduced for this feature. Verification is
  manual, via the browser (`npm run dev`) and `npx prisma studio`, following
  [quickstart.md](./quickstart.md).
- **Rationale**: This is a scoped classroom mini-project whose stated goal (per AGENTS.md and the
  course curriculum) is demonstrating the Spec-Driven Development workflow and confirming real
  SQLite persistence — not building a test suite. Introducing a test runner would add setup
  overhead disproportionate to a 4-endpoint, single-entity feature and isn't required by the
  constitution.
- **Alternatives considered**: Vitest/Jest + React Testing Library for unit/integration coverage
  — rejected for now as out of scope; can be added later without affecting this plan's structure
  if the course requires it.

## 2. Prisma Client singleton pattern in Next.js

- **Decision**: Export a single `PrismaClient` from `lib/prisma.ts`, cached on `globalThis` in
  non-production environments.
- **Rationale**: Next.js dev mode hot-reloads modules on every file save, which would otherwise
  construct a new `PrismaClient` (and new SQLite connection) per reload, quickly exhausting
  connections and producing `error: too many connections`-style failures. Caching the instance on
  `globalThis` survives hot reloads while still creating exactly one instance per cold start in
  production. This directly implements Constitution Principle IV.
- **Alternatives considered**: A bare module-level `export const prisma = new PrismaClient()`
  with no `globalThis` guard — rejected because it does not survive Next.js dev-mode hot reload
  and reintroduces the multi-instance problem the constitution explicitly calls out.

## 3. SQLite + Prisma migration workflow

- **Decision**: Use `npx prisma migrate dev --name <migration_name>` to create and apply
  migrations against `prisma/dev.db`, with `DATABASE_URL="file:./dev.db"` in `.env`.
- **Rationale**: `migrate dev` is Prisma's standard local-development workflow — it keeps
  `prisma/migrations/` as a versioned history and applies changes to the SQLite file
  synchronously, matching AGENTS.md's key command list and the constitution's persistence
  requirement.
- **Alternatives considered**: `prisma db push` (schema-sync without migration history) —
  rejected because it leaves no migration audit trail, which is worth keeping even for a small
  project since it is free.

## 4. API response envelope

- **Decision**: Every `app/api/tasks/**/route.ts` handler returns
  `NextResponse.json({ success: true, data }, { status })` on success and
  `NextResponse.json({ error }, { status })` on failure, matching Constitution Principle II
  exactly.
- **Rationale**: Constitution mandates this exact shape; using it uniformly means the frontend
  can parse every response the same way regardless of endpoint.
- **Alternatives considered**: Returning bare arrays/objects on success (e.g., `Task[]` directly)
  — rejected, violates the constitution's standardized envelope requirement.

## 5. Next.js App Router route handler conventions

- **Decision**: Use route handlers (`route.ts`) with named exports per HTTP verb
  (`GET`, `POST` in `app/api/tasks/route.ts`; `PATCH`, `DELETE` in
  `app/api/tasks/[id]/route.ts`), reading the dynamic segment via the handler's second
  argument (`{ params }`).
- **Rationale**: This is the standard App Router convention (replacing the old `pages/api`
  style), and matches the exact file layout AGENTS.md already prescribes.
- **Alternatives considered**: A single catch-all `app/api/tasks/[...slug]/route.ts` — rejected
  as unnecessary indirection for only two route shapes (`/api/tasks` and `/api/tasks/[id]`).

**Output**: All Technical Context unknowns resolved above; no remaining `NEEDS CLARIFICATION`
markers.
