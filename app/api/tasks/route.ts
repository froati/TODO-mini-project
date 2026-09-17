import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_PRIORITIES = ["High", "Medium", "Low"] as const;
type Priority = (typeof VALID_PRIORITIES)[number];

function isValidPriority(value: unknown): value is Priority {
  return (
    typeof value === "string" &&
    (VALID_PRIORITIES as readonly string[]).includes(value)
  );
}

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: tasks }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const { title, priority, dueDate } =
    typeof body === "object" && body !== null
      ? (body as { title?: unknown; priority?: unknown; dueDate?: unknown })
      : { title: undefined, priority: undefined, dueDate: undefined };

  if (typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  let resolvedPriority: Priority = "Medium";
  if (priority !== undefined) {
    if (!isValidPriority(priority)) {
      return NextResponse.json(
        { error: "invalid priority" },
        { status: 400 }
      );
    }
    resolvedPriority = priority;
  }

  let resolvedDueDate: Date | null = null;
  if (dueDate !== undefined && dueDate !== null && dueDate !== "") {
    if (typeof dueDate !== "string") {
      return NextResponse.json({ error: "invalid dueDate" }, { status: 400 });
    }
    const parsed = new Date(dueDate);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "invalid dueDate" }, { status: 400 });
    }
    resolvedDueDate = parsed;
  }

  try {
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        priority: resolvedPriority,
        dueDate: resolvedDueDate,
      },
    });
    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "failed to create task" },
      { status: 500 }
    );
  }
}
