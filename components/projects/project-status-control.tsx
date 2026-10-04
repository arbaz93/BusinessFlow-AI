"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeProjectStatus } from "@/app/actions/projects";
import { projectStatusLabels, projectStatusValues } from "@/lib/projects/options";
import { projectStatusSchema } from "@/lib/projects/schemas";

export type ProjectStatusValue = keyof typeof projectStatusLabels;

export function ProjectStatusControl({ projectId, initialStatus }: { projectId: string; initialStatus: ProjectStatusValue }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleChange(value: string) {
    const parsedStatus = projectStatusSchema.safeParse(value);
    if (!parsedStatus.success || parsedStatus.data === status) return;
    const previous = status;
    setStatus(parsedStatus.data);
    setError(null);
    startTransition(async () => {
      const result = await changeProjectStatus(projectId, parsedStatus.data, previous);
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
      <label className="sr-only" htmlFor={`project-status-${projectId}`}>Project status</label>
      <select
        id={`project-status-${projectId}`}
        value={status}
        disabled={pending}
        onChange={(event) => handleChange(event.currentTarget.value)}
        className="h-10 max-w-full rounded-lg border border-white/10 bg-[#18181b] px-2.5 text-sm font-medium text-white/85 outline-none transition-colors hover:border-white/20 focus-visible:ring-2 focus-visible:ring-[#a49bff] disabled:opacity-55"
      >
        {projectStatusValues.map((item) => <option key={item} value={item}>{projectStatusLabels[item]}</option>)}
      </select>
      {error && <p role="alert" className="mt-1 max-w-56 text-[11px] leading-4 text-[#fca5a5]">{error}</p>}
    </div>
  );
}
