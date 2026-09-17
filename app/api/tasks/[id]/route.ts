import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

function isRecordNotFoundError(
  error: unknown
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId)) {
    return NextResponse.json({ error: "task not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "completed must be a boolean" },
      { status: 400 }
    );
  }

  const completed =
    typeof body === "object" && body !== null
      ? (body as { completed?: unknown }).completed
      : undefined;

  if (typeof completed !== "boolean") {
    return NextResponse.json(
      { error: "completed must be a boolean" },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) {
      return NextResponse.json({ error: "task not found" }, { status: 404 });
    }

    if (existing.dueDate === null) {
      // Daily recurring task: "completed" means "checked today", derived from
      // lastCompletedAt rather than stored directly, so it naturally resets
      // the next day without any scheduled job.
      const todayKey = localDateKey(new Date());
      const checkedToday =
        existing.lastCompletedAt !== null &&
        localDateKey(existing.lastCompletedAt) === todayKey;

      let data: { lastCompletedAt?: Date | null; dailyCount?: number } = {};
      if (completed && !checkedToday) {
        data = { lastCompletedAt: new Date(), dailyCount: existing.dailyCount + 1 };
      } else if (!completed && checkedToday) {
        data = {
          lastCompletedAt: null,
          dailyCount: Math.max(0, existing.dailyCount - 1),
        };
      }

      const task = await prisma.task.update({ where: { id: taskId }, data });
      return NextResponse.json({ success: true, data: task }, { status: 200 });
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { completed },
    });
    return NextResponse.json({ success: true, data: task }, { status: 200 });
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return NextResponse.json({ error: "task not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId)) {
    return NextResponse.json({ error: "task not found" }, { status: 404 });
  }

  try {
    await prisma.task.delete({ where: { id: taskId } });
    return NextResponse.json(
      { success: true, data: { id: taskId } },
      { status: 200 }
    );
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return NextResponse.json({ error: "task not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "failed to delete task" },
      { status: 500 }
    );
  }
}
