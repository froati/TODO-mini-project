"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Priority = "High" | "Medium" | "Low";

interface Task {
  id: number;
  title: string;
  completed: boolean;
  priority: Priority;
  dueDate: string | null;
  dailyCount: number;
  lastCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

type ApiResponse<T> = { success: true; data: T } | { error: string };

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

// dueDate comes from a plain "YYYY-MM-DD" date input, parsed as UTC
// midnight by the server — read it back with UTC getters so the day
// never shifts under local timezones.
function dueDateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

// "today" as the browser's local calendar day, formatted the same way a
// <input type="date"> value would be — comparable directly with dueDateKey.
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatDueDate(dueDate: string): string {
  const d = new Date(dueDate);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} 마감`;
}

function daysOverdue(dueDate: string): number {
  const [dy, dm, dd] = dueDateKey(dueDate).split("-").map(Number);
  const [ty, tm, td] = todayKey().split("-").map(Number);
  const dueUTC = Date.UTC(dy, dm - 1, dd);
  const nowUTC = Date.UTC(ty, tm - 1, td);
  return Math.round((nowUTC - dueUTC) / 86_400_000);
}

// lastCompletedAt is a real timestamp (not a plain date), so read it with
// local getters to get the day it was actually checked in the user's
// own timezone.
function isCheckedToday(task: Task): boolean {
  if (!task.lastCompletedAt) return false;
  const d = new Date(task.lastCompletedAt);
  const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  return key === todayKey();
}

const PRIORITIES: Priority[] = ["High", "Medium", "Low"];

const PRIORITY_LABELS: Record<Priority, string> = {
  High: "높음",
  Medium: "보통",
  Low: "낮음",
};

const PRIORITY_STYLES: Record<Priority, string> = {
  High: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  Medium:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  Low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
};

const PRIORITY_TAB_ACTIVE: Record<Priority, string> = {
  High: "bg-red-600 text-white dark:bg-red-500",
  Medium: "bg-amber-500 text-white dark:bg-amber-500",
  Low: "bg-emerald-600 text-white dark:bg-emerald-500",
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [dueDate, setDueDate] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      try {
        const res = await fetch("/api/tasks");
        const json: ApiResponse<Task[]> = await res.json();
        if (!cancelled && "success" in json) {
          setTasks(json.data);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadTasks();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTitleError(null);

    if (title.trim().length === 0) {
      setTitleError("제목을 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, priority, dueDate }),
      });
      const json: ApiResponse<Task> = await res.json();
      if ("success" in json) {
        setTasks((prev) => [json.data, ...prev]);
        setTitle("");
        setPriority("Medium");
        setDueDate("");
      } else {
        setTitleError(json.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggle(task: Task) {
    const nextCompleted =
      task.dueDate === null ? !isCheckedToday(task) : !task.completed;
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: nextCompleted }),
    });
    const json: ApiResponse<Task> = await res.json();
    if ("success" in json) {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? json.data : t))
      );
    }
  }

  async function handleDelete(taskId: number) {
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    const json: ApiResponse<{ id: number }> = await res.json();
    if ("success" in json) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }
  }

  // Daily recurring tasks (dueDate === null) always stay visible; one-off
  // tasks (dueDate set) leave this list once completed — they show up in
  // "끝난 일" instead.
  const visibleTasks = tasks.filter(
    (task) => task.dueDate === null || !task.completed
  );

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-4 py-12 font-sans dark:bg-black">
      <main className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            할 일 목록
          </h1>
          <nav className="flex gap-1 rounded-md border border-zinc-300 p-1 text-sm dark:border-zinc-700">
            <span className="rounded px-3 py-1 font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
              목록
            </span>
            <Link
              href="/finished"
              className="rounded px-3 py-1 text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              끝난 일
            </Link>
          </nav>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mb-8 flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="할 일을 입력하세요"
              aria-label="할 일 제목"
              className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              추가
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            마감일
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              aria-label="마감일 (선택)"
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <span className="text-xs text-zinc-400 dark:text-zinc-600">
              비워두면 매일 반복되는 할 일이 됩니다
            </span>
          </label>

          <div
            role="tablist"
            aria-label="우선순위 선택"
            className="flex divide-x divide-zinc-300 overflow-hidden rounded-md border border-zinc-300 dark:divide-zinc-700 dark:border-zinc-700"
          >
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={priority === p}
                onClick={() => setPriority(p)}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  priority === p
                    ? PRIORITY_TAB_ACTIVE[p]
                    : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
              >
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
          {titleError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {titleError}
            </p>
          )}
        </form>

        {isLoading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            불러오는 중...
          </p>
        ) : visibleTasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            아직 할 일이 없습니다. 위에서 추가해 보세요.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {visibleTasks.map((task, index) => {
              const isDaily = task.dueDate === null;
              const checked = isDaily ? isCheckedToday(task) : task.completed;
              const overdue =
                !isDaily && task.dueDate !== null && !task.completed
                  ? daysOverdue(task.dueDate)
                  : 0;
              return (
                <li
                  key={task.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="w-5 shrink-0 text-right text-sm text-zinc-400 dark:text-zinc-600">
                    {index + 1}
                  </span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => void handleToggle(task)}
                    aria-label={`${task.title} 완료 여부`}
                    className="h-4 w-4 shrink-0"
                  />
                  <span
                    className={`flex-1 text-sm ${
                      checked
                        ? "text-zinc-400 line-through dark:text-zinc-600"
                        : "text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    {task.title}
                  </span>
                  {!isDaily && task.dueDate && (
                    <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-600">
                      {formatDueDate(task.dueDate)}
                    </span>
                  )}
                  {overdue > 0 && (
                    <span className="shrink-0 rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
                      D+{overdue}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}
                  >
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleDelete(task.id)}
                    aria-label={`${task.title} 삭제`}
                    className="text-sm text-zinc-400 transition-colors hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400"
                  >
                    삭제
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
