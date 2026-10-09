"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeTaskStatus } from "@/app/actions/tasks";
import { taskStatusLabels, taskStatusValues } from "@/lib/tasks/options";
import { taskStatusSchema } from "@/lib/tasks/schemas";

export type TaskStatusValue = keyof typeof taskStatusLabels;

export function TaskStatusControl({ taskId, initialStatus }: { taskId: string; initialStatus: TaskStatusValue }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleChange(value: string) {
    const parsedStatus = taskStatusSchema.safeParse(value);
    if (!parsedStatus.success || parsedStatus.data === status) return;

    const previous = status;
    setStatus(parsedStatus.data);
    setError(null);

    startTransition(async () => {
      const result = await changeTaskStatus(taskId, parsedStatus.data, previous);
      if (result.error) {
        setStatus(previous);
        setError(result.error);
        router.refresh();
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="min-w-0">
      <label className="sr-only" htmlFor={`task-status-${taskId}`}>Task status</label>
      <select
        id={`task-status-${taskId}`}
        value={status}
        disabled={pending}
        onChange={(event) => handleChange(event.currentTarget.value)}
        className="h-10 max-w-full rounded-lg border border-[var(--line)] bg-[var(--panel)] px-2.5 text-sm font-medium text-[var(--foreground)] outline-none transition-colors hover:border-[var(--line-strong)] focus-visible:ring-2 focus-visible:ring-[#a49bff] disabled:opacity-55"
      >
        {taskStatusValues.map((item) => (
          <option key={item} value={item}>{taskStatusLabels[item]}</option>
        ))}
      </select>
      {error && <p role="alert" className="mt-1 max-w-56 text-[11px] leading-4 text-[#fca5a5]">{error}</p>}
    </div>
  );
}
