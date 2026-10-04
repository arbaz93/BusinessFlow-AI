"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { Pencil, Plus, X } from "lucide-react";
import { saveProjectTask, saveTask } from "@/app/actions/tasks";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { taskPriorityLabels, taskPriorityValues, taskStatusLabels, taskStatusValues } from "@/lib/tasks/options";
import type { TaskInput } from "@/lib/tasks/schemas";

type ProjectChoice = { id: string; name: string; clientName: string | null };
type TeamMember = { id: string; name: string; email: string | null };

type TaskDraft = TaskInput & { id?: string; updatedAt?: string };

export function TaskFormDialog({
  task,
  projects,
  teamMembers,
  fixedProjectId,
  triggerLabel,
}: {
  task?: TaskDraft;
  projects: ProjectChoice[];
  teamMembers: TeamMember[];
  fixedProjectId?: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={task
            ? "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#18181b] px-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]"
            : "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#7067e8] px-4 text-sm font-medium text-white transition-colors hover:bg-[#8178f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]"}
        >
          {task ? <Pencil size={15} /> : <Plus size={16} />}
          {task ? "Edit Task" : triggerLabel ?? "New Task"}
        </button>
      </Dialog.Trigger>
      {open && <TaskForm task={task} projects={projects} teamMembers={teamMembers} fixedProjectId={fixedProjectId} onClose={() => setOpen(false)} />}
    </Dialog.Root>
  );
}

function TaskForm({
  task,
  projects,
  teamMembers,
  fixedProjectId,
  onClose,
}: {
  task?: TaskDraft;
  projects: ProjectChoice[];
  teamMembers: TeamMember[];
  fixedProjectId?: string;
  onClose: () => void;
}) {
  const action = fixedProjectId ? saveProjectTask.bind(null, fixedProjectId) : saveTask;
  const [state, formAction, pending] = useActionState(action, {});
  const [values, setValues] = useState({
    title: task?.title ?? "",
    projectId: task?.projectId ?? fixedProjectId ?? projects[0]?.id ?? "",
    description: task?.description ?? "",
    status: task?.status ?? "TODO",
    priority: task?.priority ?? "MEDIUM",
    dueDate: task?.dueDate ? formatDateInput(task.dueDate) : "",
    assigneeId: task?.assigneeId ?? "",
  });
  const submissionLocked = useRef(false);

  useEffect(() => {
    if (state.success) onClose();
  }, [onClose, state.success]);

  useEffect(() => {
    if (!pending) submissionLocked.current = false;
  }, [pending]);

  function fieldError(field: keyof TaskInput | "projectId") {
    return state.fieldErrors?.[field]?.[0];
  }

  const inputClass = "h-10 border-white/10 bg-[#111113] text-sm text-white placeholder:text-white/30 focus-visible:border-[#a49bff] focus-visible:ring-[#a49bff]/20 dark:bg-[#111113]";
  const selectClass = "h-10 w-full rounded-md border border-white/10 bg-[#111113] px-3 text-sm text-white outline-none focus-visible:border-[#a49bff] focus-visible:ring-[3px] focus-visible:ring-[#a49bff]/20";
  const labelClass = "mb-1.5 block text-xs font-medium text-white/70";

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px]" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-[620px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-white/10 bg-[#18181b] p-5 text-white shadow-2xl outline-none sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Dialog.Title className="text-lg font-semibold tracking-[-0.02em] text-[#f4f4f5]">{task ? "Edit Task" : "New Task"}</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-white/50">{task ? "Update task details and project delivery timing." : "Create a delivery task connected to a project."}</Dialog.Description>
          </div>
          <Dialog.Close asChild>
            <button type="button" aria-label="Close dialog" className="grid size-9 shrink-0 place-items-center rounded-lg text-white/55 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]">
              <X size={17} />
            </button>
          </Dialog.Close>
        </div>

        <form
          action={formAction}
          onSubmit={(event) => {
            if (submissionLocked.current) {
              event.preventDefault();
              return;
            }
            submissionLocked.current = true;
          }}
          className="mt-6 space-y-4"
        >
          {task && task.id && <input type="hidden" name="taskId" value={task.id} />}
          {task && task.updatedAt && <input type="hidden" name="expectedUpdatedAt" value={task.updatedAt} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="task-title" className={labelClass}>Task title <span className="text-[#fca5a5]">*</span></label>
              <Input id="task-title" name="title" required maxLength={160} value={values.title} onChange={(event) => setValues({ ...values, title: event.currentTarget.value })} aria-invalid={Boolean(fieldError("title"))} aria-describedby={fieldError("title") ? "task-title-error" : undefined} className={inputClass} />
              {fieldError("title") && <p id="task-title-error" className="mt-1 text-xs text-[#fca5a5]">{fieldError("title")}</p>}
            </div>

            <div>
              {fixedProjectId ? (
                <>
                  <p className={labelClass}>Project <span className="text-[#fca5a5]">*</span></p>
                  <input type="hidden" name="projectId" value={fixedProjectId} />
                  <p className="flex h-10 items-center rounded-md border border-white/10 bg-[#111113] px-3 text-sm text-white/80">
                    {projects.find((project) => project.id === fixedProjectId)?.name ?? "Current project"}
                    {projects.find((project) => project.id === fixedProjectId)?.clientName
                      ? ` · ${projects.find((project) => project.id === fixedProjectId)?.clientName}`
                      : ""}
                  </p>
                </>
              ) : (
                <>
                  <label htmlFor="task-project" className={labelClass}>Project <span className="text-[#fca5a5]">*</span></label>
                  <select id="task-project" name="projectId" value={values.projectId} onChange={(event) => setValues({ ...values, projectId: event.currentTarget.value })} className={selectClass}>
                    <option value="" disabled>Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}{project.clientName ? ` · ${project.clientName}` : ""}</option>
                    ))}
                  </select>
                </>
              )}
              {fieldError("projectId") && <p id="task-project-error" className="mt-1 text-xs text-[#fca5a5]">{fieldError("projectId")}</p>}
            </div>

            <div>
              <label htmlFor="task-assignee" className={labelClass}>Assignee</label>
              <select id="task-assignee" name="assigneeId" value={values.assigneeId} onChange={(event) => setValues({ ...values, assigneeId: event.currentTarget.value })} className={selectClass}>
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="task-status" className={labelClass}>Status</label>
              <select id="task-status" name="status" value={values.status} onChange={(event) => setValues({ ...values, status: event.currentTarget.value as TaskInput["status"] })} className={selectClass}>
                {taskStatusValues.map((status) => (
                  <option key={status} value={status}>{taskStatusLabels[status]}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="task-priority" className={labelClass}>Priority</label>
              <select id="task-priority" name="priority" value={values.priority} onChange={(event) => setValues({ ...values, priority: event.currentTarget.value as TaskInput["priority"] })} className={selectClass}>
                {taskPriorityValues.map((priority) => (
                  <option key={priority} value={priority}>{taskPriorityLabels[priority]}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="task-due-date" className={labelClass}>Due date</label>
              <Input id="task-due-date" name="dueDate" type="date" value={values.dueDate} onChange={(event) => setValues({ ...values, dueDate: event.currentTarget.value })} className={inputClass} />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="task-description" className={labelClass}>Description</label>
              <Textarea id="task-description" name="description" rows={5} value={values.description} onChange={(event) => setValues({ ...values, description: event.currentTarget.value })} className="min-h-[120px] border-white/10 bg-[#111113] text-sm text-white placeholder:text-white/30 focus-visible:border-[#a49bff] focus-visible:ring-[#a49bff]/20 dark:bg-[#111113]" placeholder="Describe the task and expected outcome." />
            </div>
          </div>

          {state.error && <p role="alert" className="mt-4 rounded-md border border-[#ef4444]/20 bg-[#ef4444]/[0.08] px-3 py-2 text-sm text-[#fca5a5]">{state.error}</p>}

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-white/8 pt-4 sm:flex-row sm:justify-end">
            <Dialog.Close asChild>
              <button type="button" disabled={pending} className="h-10 rounded-lg px-4 text-sm font-medium text-white/65 transition-colors hover:bg-white/[0.05] hover:text-white disabled:opacity-50">Cancel</button>
            </Dialog.Close>
            <button type="submit" disabled={pending} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#7067e8] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#8178f0] disabled:cursor-not-allowed disabled:opacity-55">
              {pending ? (task ? "Saving…" : "Creating…") : task ? "Save task" : "Create task"}
            </button>
          </div>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

function formatDateInput(date: Date | string | undefined) {
  if (!date) return "";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  return value.toISOString().slice(0, 10);
}
