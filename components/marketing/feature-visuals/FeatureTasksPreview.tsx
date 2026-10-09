"use client";

import { FeatureVisual } from "./FeatureVisual";
import { CheckCheck, Circle, Minus } from "lucide-react";

const taskStatusStyles = {
  COMPLETED: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20",
  IN_PROGRESS: "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20",
  TODO: "bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20",
};

const taskStatusIcons = {
  COMPLETED: <CheckCheck size={12} className="text-[var(--success)]" />,
  IN_PROGRESS: <Minus size={12} className="text-[var(--accent)]" />,
  TODO: <Circle size={12} className="text-[var(--info)]" />,
};

interface FeaturePreviewProps {
  className?: string;
}

export function FeatureTasksPreview({ className }: FeaturePreviewProps) {
  const tasks = [
    { title: "Review brand positioning", status: "COMPLETED" as const },
    { title: "Define homepage structure", status: "IN_PROGRESS" as const },
    { title: "Prepare visual direction", status: "TODO" as const },
  ];

  return (
    <FeatureVisual aria-label="Task Management preview showing task rows with status indicators" className={className}>
      <div className="space-y-4 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-muted)]">Project Tasks</span>
          <span className="text-[11px] text-[var(--muted)]">3 tasks</span>
        </div>
        <div className="space-y-2">
          {tasks.map((task, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
              <div className="flex-shrink-0">
                {taskStatusIcons[task.status]}
              </div>
              <p className="text-sm font-medium text-[var(--foreground)] truncate flex-1">{task.title}</p>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border shrink-0 ${taskStatusStyles[task.status]}`}>
                {task.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
        <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between text-sm">
          <span className="text-[var(--muted)]">All connected to project</span>
          <span className="text-[var(--accent)] font-medium">View board →</span>
        </div>
      </div>
    </FeatureVisual>
  );
}