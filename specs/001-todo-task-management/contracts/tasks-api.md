# API Contract: Tasks

Base path: `/api/tasks`. All responses are JSON with the standardized envelope from
`.specify/memory/constitution.md` § Principle II:
- Success: `{ "success": true, "data": ... }`
- Failure: `{ "error": "<message>" }`

## GET /api/tasks

List all tasks, newest first (FR-005).

- **Request**: no body, no query params required.
- **Success `200`**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 2,
        "title": "우유 사기",
        "completed": false,
        "priority": "High",
        "createdAt": "2026-09-16T10:05:00.000Z",
        "updatedAt": "2026-09-16T10:05:00.000Z"
      },
      {
        "id": 1,
        "title": "청소하기",
        "completed": true,
        "priority": "Medium",
        "createdAt": "2026-09-16T10:00:00.000Z",
        "updatedAt": "2026-09-16T10:10:00.000Z"
      }
    ]
  }
  ```
  `data` is `[]` when no tasks exist (FR-009) — not an error.
- **Failure `500`**: `{ "error": "failed to fetch tasks" }`

## POST /api/tasks

Create a task (FR-001, FR-002, FR-003, FR-004).

- **Request body**:
  ```json
  { "title": "우유 사기", "priority": "High" }
  ```
  `priority` is optional; when omitted, defaults to `"Medium"`.
- **Success `201`**:
  ```json
  {
    "success": true,
    "data": {
      "id": 3,
      "title": "우유 사기",
      "completed": false,
      "priority": "High",
      "createdAt": "2026-09-16T10:15:00.000Z",
      "updatedAt": "2026-09-16T10:15:00.000Z"
    }
  }
  ```
- **Failure `400`** (missing/blank title): `{ "error": "title is required" }`
- **Failure `400`** (invalid priority): `{ "error": "invalid priority" }`
- **Failure `500`**: `{ "error": "failed to create task" }`

## PATCH /api/tasks/{id}

Toggle or update a task's `completed` status (FR-006). `{id}` is the numeric Task `id`.

- **Request body**:
  ```json
  { "completed": true }
  ```
- **Success `200`**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "title": "청소하기",
      "completed": true,
      "priority": "Medium",
      "createdAt": "2026-09-16T10:00:00.000Z",
      "updatedAt": "2026-09-16T10:20:00.000Z"
    }
  }
  ```
- **Failure `404`** (no task with that id): `{ "error": "task not found" }`
- **Failure `400`** (missing/invalid `completed` value): `{ "error": "completed must be a boolean" }`
- **Failure `500`**: `{ "error": "failed to update task" }`

## DELETE /api/tasks/{id}

Delete a task regardless of completion status (FR-007). `{id}` is the numeric Task `id`.

- **Request**: no body.
- **Success `200`**:
  ```json
  { "success": true, "data": { "id": 1 } }
  ```
- **Failure `404`** (no task with that id): `{ "error": "task not found" }`
- **Failure `500`**: `{ "error": "failed to delete task" }`
