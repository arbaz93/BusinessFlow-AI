import { MockupFrame } from "./MockupFrame";
import { mockApprovalTasks, priorityStyles } from "./mockupData";
import { cn } from "@/lib/utils";
import { AlertTriangle, Sparkles, CheckCheck, X } from "lucide-react";

interface TaskApprovalMockupProps {
  className?: string;
}

export function TaskApprovalMockup({ className }: TaskApprovalMockupProps) {
  return (
    <MockupFrame title="AI Task Approval" subtitle="Review queue" className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
            <Sparkles size={14} className="text-[var(--accent)]" />
            Approval Queue
          </h3>
          <span className="text-[11px] text-[var(--muted)]">{mockApprovalTasks.length} suggestions pending</span>
        </div>

        <div className="space-y-3">
          {mockApprovalTasks.map((task, i) => (
            <div
              key={i}
              className={`rounded-lg border bg-[var(--surface)] overflow-hidden ${task.status === "expanded" ? "border-[var(--accent)]/30" : "border-[var(--line)]"}`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-semibold text-[var(--foreground)]">{task.title}</h4>
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${priorityStyles[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[var(--muted-foreground)] flex-wrap">
                      <span>{task.requirement}</span>
                      {task.risk && (
                        <span className="flex items-center gap-1 text-[var(--warning)]">
                          <AlertTriangle size={10} />
                          {task.risk}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button className="rounded border border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] text-[11px] font-medium px-3 py-1.5 hover:bg-[var(--background)] flex items-center gap-1">
                      <X size={12} /> Reject
                    </button>
                    <button className="rounded border border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] text-[11px] font-medium px-3 py-1.5 hover:bg-[var(--background)]">
                      Edit
                    </button>
                    <button className="rounded bg-[var(--accent)] text-white text-[11px] font-medium px-3 py-1.5 hover:opacity-80 flex items-center gap-1">
                      <CheckCheck size={12} /> Approve
                    </button>
                  </div>
                </div>
              </div>

              {task.status === "expanded" && (
                <div className="border-t border-[var(--line)] bg-[var(--background)] p-4">
                  <h5 className="text-sm font-semibold text-[var(--foreground)] mb-3">Edit Task</h5>
                  <div className="space-y-3 w-full">
                    <div>
                      <label className="text-[11px] font-medium text-[var(--muted)]">Title</label>
                      <input
                        type="text"
                        defaultValue={task.title}
                        className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]"
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-[11px] font-medium text-[var(--muted)]">Priority</label>
                        <select className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]">
                          <option>High</option>
                          <option>Medium</option>
                          <option>Low</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-[var(--muted)]">Assignee</label>
                        <select className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]">
                          <option>Sarah Mitchell</option>
                          <option>Marcus Webb</option>
                          <option>Priya Patel</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-[var(--muted)]">Description</label>
                      <textarea
                        defaultValue={`Auto-generated from AI analysis. Linked to: ${task.requirement}`}
                        className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] min-h-[80px] resize-y"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button className="rounded border border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] text-[11px] font-medium px-3 py-1.5 hover:bg-[var(--background)]">
                        Cancel
                      </button>
                      <button className="rounded bg-[var(--accent)] text-white text-[11px] font-medium px-3 py-1.5 hover:opacity-80 flex items-center gap-1">
                        <CheckCheck size={12} /> Save & Approve
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-[11px] text-center text-[var(--muted-foreground)]">
          Approved tasks enter the project task board as real work items
        </p>
      </div>
    </MockupFrame>
  );
}