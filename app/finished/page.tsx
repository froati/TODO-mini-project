"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

function formatDueDate(dueDate: string): string {
  const d = new Date(dueDate);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} 마감`;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// lastCompletedAt is a real timestamp, so read it with local getters to get
// the day it was actually checked in the user's own timezone.
function isCheckedToday(task: Task): boolean {
  if (!task.lastCompletedAt) return false;
  const d = new Date(task.lastCompletedAt);
  const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  return key === todayKey();
}

export default function FinishedPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  async function handleDelete(taskId: number) {
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    const json: ApiResponse<{ id: number }> = await res.json();
    if ("success" in json) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }
  }

  // One-off (dueDate set) tasks that are completed live here permanently.
  // Daily recurring tasks show up here only for the day they were checked
  // off — they naturally drop out again once the day rolls over, since
  // "checked today" is derived from lastCompletedAt, not stored directly.
  const finishedTasks = tasks.filter(
    (task) =>
      (task.dueDate !== null && task.completed) ||
      (task.dueDate === null && isCheckedToday(task))
  );

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-4 py-12 font-sans dark:bg-black">
      <main className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            끝난 일
          </h1>
          <nav className="flex gap-1 rounded-md border border-zinc-300 p-1 text-sm dark:border-zinc-700">
            <Link
              href="/"
              className="rounded px-3 py-1 text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              목록
            </Link>
            <span className="rounded px-3 py-1 font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
              끝난 일
            </span>
          </nav>
        </div>

        <p className="mb-4 text-xs text-zinc-400 dark:text-zinc-600">
          완료된 할 일과 오늘 체크한 매일 할 일(완료 횟수 포함)의 기록입니다.
          매일 할 일은 다음 날이 되면 자동으로 빠집니다. 필요 없어지면 각
          항목의 삭제 버튼으로 지울 수 있습니다.
        </p>

        {isLoading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            불러오는 중...
          </p>
        ) : finishedTasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            아직 끝난 일이 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {finishedTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="flex-1 text-sm text-zinc-400 line-through dark:text-zinc-600">
                  {task.title}
                </span>
                {task.dueDate === null && (
                  <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-600">
                    {task.dailyCount}회
                  </span>
                )}
                {task.dueDate && (
                  <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-600">
                    {formatDueDate(task.dueDate)}
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
                  aria-label={`${task.title} 기록 삭제`}
                  className="text-sm text-zinc-400 transition-colors hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
