# Quickstart: Todo Task Management

Manual end-to-end validation for this feature (no automated test suite — see
[research.md](./research.md) § 1).

## Prerequisites

- Node.js and npm installed.
- Project dependencies installed: `npm install`.
- Prisma Client generated and `dev.db` migrated:
  ```bash
  npx prisma generate
  npx prisma migrate dev --name init_task
  ```
- `.env` contains `DATABASE_URL="file:./dev.db"`.

## Run

```bash
npm run dev
```
Open `http://localhost:3000`.

## Validation scenarios

Each scenario maps to an Acceptance Scenario in [spec.md](./spec.md).

1. **Add a task with priority** (User Story 1, Scenario 1)
   - Enter title "우유 사기", select priority "High", submit.
   - Expect: task appears at the top of the list, showing title, priority "High", not completed.

2. **Add a task without choosing priority** (User Story 1, Scenario 4)
   - Enter a title, leave priority unset, submit.
   - Expect: task is created with priority "Medium".

3. **Reject empty title** (User Story 1, Scenario 3)
   - Leave the title blank, submit.
   - Expect: an inline error is shown; no new task appears in the list.

4. **Toggle completion, position unchanged** (User Story 2, all scenarios; Clarification Session 2026-09-16)
   - Toggle a task's completion checkbox.
   - Expect: the task shows a "done" visual indicator (no separate section), and its position in
     the list does not change. Toggle again to confirm it reverts.

5. **Delete a task, including a completed one** (User Story 3, all scenarios)
   - Delete an incomplete task → it disappears from the list.
   - Mark a task completed, then delete it → it also disappears, with no special handling
     required.

6. **Empty state** (spec Edge Cases)
   - Delete all tasks.
   - Expect: the list shows an empty state, not an error.

## Persistence check (the highlight of this exercise)

With the dev server still running, open a second terminal tab:
```bash
npx prisma studio
```
Open `http://localhost:5555`, select the `Task` table, and confirm every task created, toggled,
or deleted in the browser is reflected there. Reload `http://localhost:3000` and confirm all
tasks are still present exactly as left (validates FR-008 / SC-002).
