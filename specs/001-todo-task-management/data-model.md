# Phase 1 Data Model: Todo Task Management

## Entity: Task

Source: [spec.md § Key Entities](./spec.md#key-entities), constrained by
`.specify/memory/constitution.md` § Technology Stack & Architecture Constraints.

| Field | Type | Constraints / Notes |
|---|---|---|
| `id` | Int | Primary key, autoincrement |
| `title` | String | Required, non-empty after trim (FR-002) — validated in the API route before persisting |
| `completed` | Boolean | Default `false` at creation (FR-001); toggled by PATCH (FR-006); does not affect list position (Clarification, Session 2026-09-16) |
| `priority` | String | One of `"High" \| "Medium" \| "Low"` (FR-004); defaults to `"Medium"` when omitted at creation (FR-003) |
| `createdAt` | DateTime | Set automatically on creation; used as the sole sort key for the list, newest first (FR-005) |
| `updatedAt` | DateTime | Set automatically on every update (Prisma `@updatedAt`) |

### Prisma schema mapping (`prisma/schema.prisma`)

```prisma
model Task {
  id        Int      @id @default(autoincrement())
  title     String
  completed Boolean  @default(false)
  priority  String   @default("Medium") // "High" | "Medium" | "Low"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

This matches AGENTS.md's data model specification exactly — no deviation.

### Validation rules (enforced in API route handlers, not just the DB)

- `title`: reject creation if missing, empty, or whitespace-only → `400` with
  `{ "error": "title is required" }` (FR-002, spec Edge Cases).
- `priority`: if provided, must be exactly `"High"`, `"Medium"`, or `"Low"`; any other value →
  `400` with `{ "error": "invalid priority" }` (FR-004, spec Edge Cases). If omitted, defaults to
  `"Medium"` at the application layer (matches the Prisma default, but is validated explicitly so
  an invalid value is never silently coerced).

### State transitions

- `completed`: `false → true` and `true → false` via `PATCH /api/tasks/{id}` (toggle). No other
  states exist; there is no "archived" or "deleted-but-recoverable" state — delete is permanent
  (FR-007).

### Relationships

None — `Task` is a single, self-contained entity with no foreign keys or related tables, matching
the spec's single-list, single-entity scope (see spec.md § Assumptions).

### Ordering

List reads (`GET /api/tasks`) are always ordered by `createdAt` descending (newest first),
regardless of `completed` state — per FR-005 and the Session 2026-09-16 clarification that
completed and active tasks are never separated into different views or positions.
