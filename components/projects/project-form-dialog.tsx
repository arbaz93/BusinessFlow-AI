"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { Pencil, Plus, X } from "lucide-react";
import { saveProject } from "@/app/actions/projects";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { projectPriorityLabels, projectPriorityValues, projectStatusLabels, projectStatusValues } from "@/lib/projects/options";
import type { ProjectInput } from "@/lib/projects/schemas";

type ClientChoice = { id: string; name: string; company: string | null };

type ProjectDraft = ProjectInput & { id?: string; updatedAt?: string };

export function ProjectFormDialog({
  project,
  clients,
  defaultClientId,
  triggerLabel,
}: {
  project?: ProjectDraft;
  clients: ClientChoice[];
  defaultClientId?: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={project
            ? "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 text-sm font-medium text-foreground transition-colors hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            : "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"}
        >
          {project ? <Pencil size={15} /> : <Plus size={16} />}
          {project ? "Edit Project" : triggerLabel ?? "New Project"}
        </button>
      </Dialog.Trigger>
      {open && <ProjectForm project={project} clients={clients} defaultClientId={defaultClientId} onClose={() => setOpen(false)} />}
    </Dialog.Root>
  );
}

function ProjectForm({
  project,
  clients,
  defaultClientId,
  onClose,
}: {
  project?: ProjectDraft;
  clients: ClientChoice[];
  defaultClientId?: string;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveProject, {});
  const [values, setValues] = useState({
    name: project?.name ?? "",
    clientId: project?.clientId ?? defaultClientId ?? clients[0]?.id ?? "",
    description: project?.description ?? "",
    status: project?.status ?? "PLANNING",
    priority: project?.priority ?? "MEDIUM",
    startDate: project?.startDate ? formatDateInput(project.startDate) : "",
    dueDate: project?.dueDate ? formatDateInput(project.dueDate) : "",
    notes: project?.notes ?? "",
  });
  const submissionLocked = useRef(false);

  useEffect(() => {
    if (state.success) onClose();
  }, [onClose, state.success]);

  useEffect(() => {
    if (!pending) submissionLocked.current = false;
  }, [pending]);

  function fieldError(field: keyof ProjectInput | "clientId") {
    return state.fieldErrors?.[field]?.[0];
  }

  const inputClass = "h-10 border-[var(--line)] bg-[var(--surface)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent)]/20 dark:bg-[var(--surface)]";
  const selectClass = "h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus-visible:border-[var(--accent)] focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]/20";
  const labelClass = "mb-1.5 block text-xs font-medium text-[var(--muted)]";

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px]" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-[620px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5 text-[var(--foreground)] shadow-2xl outline-none sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Dialog.Title className="text-lg font-semibold tracking-[-0.02em] text-[var(--foreground)]">{project ? "Edit Project" : "New Project"}</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-[var(--muted)]">{project ? "Update the project details and delivery timeline." : "Create a delivery project for a client in your workspace."}</Dialog.Description>
          </div>
          <Dialog.Close asChild>
            <button type="button" aria-label="Close dialog" className="grid size-9 shrink-0 place-items-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
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
          {project && project.id && <input type="hidden" name="projectId" value={project.id} />}
          {project && project.updatedAt && <input type="hidden" name="expectedUpdatedAt" value={project.updatedAt} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="project-name" className={labelClass}>Project name <span className="text-[#fca5a5]">*</span></label>
              <Input id="project-name" name="name" required maxLength={120} value={values.name} onChange={(event) => setValues({ ...values, name: event.currentTarget.value })} aria-invalid={Boolean(fieldError("name"))} aria-describedby={fieldError("name") ? "project-name-error" : undefined} className={inputClass} />
              {fieldError("name") && <p id="project-name-error" className="mt-1 text-xs text-[#fca5a5]">{fieldError("name")}</p>}
            </div>

            <div>
              <label htmlFor="project-client" className={labelClass}>Client <span className="text-[#fca5a5]">*</span></label>
              <select
                id="project-client"
                name="clientId"
                value={values.clientId}
                onChange={(event) => setValues({ ...values, clientId: event.currentTarget.value })}
                aria-invalid={Boolean(fieldError("clientId"))}
                aria-describedby={fieldError("clientId") ? "project-client-error" : undefined}
                className={selectClass}
              >
                <option value="" disabled>Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}{client.company ? ` · ${client.company}` : ""}</option>
                ))}
              </select>
              {fieldError("clientId") && <p id="project-client-error" className="mt-1 text-xs text-[#fca5a5]">{fieldError("clientId")}</p>}
            </div>

            <div>
              <label htmlFor="project-status" className={labelClass}>Status</label>
              <select
                id="project-status"
                name="status"
                value={values.status}
                onChange={(event) => setValues({ ...values, status: event.currentTarget.value as ProjectInput["status"] })}
                className={selectClass}
              >
                {projectStatusValues.map((status) => (
                  <option key={status} value={status}>{projectStatusLabels[status]}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="project-priority" className={labelClass}>Priority</label>
              <select
                id="project-priority"
                name="priority"
                value={values.priority}
                onChange={(event) => setValues({ ...values, priority: event.currentTarget.value as ProjectInput["priority"] })}
                className={selectClass}
              >
                {projectPriorityValues.map((priority) => (
                  <option key={priority} value={priority}>{projectPriorityLabels[priority]}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="project-start-date" className={labelClass}>Start date</label>
              <Input id="project-start-date" name="startDate" type="date" value={values.startDate} onChange={(event) => setValues({ ...values, startDate: event.currentTarget.value })} className={inputClass} />
            </div>

            <div>
              <label htmlFor="project-due-date" className={labelClass}>Due date</label>
              <Input id="project-due-date" name="dueDate" type="date" value={values.dueDate} onChange={(event) => setValues({ ...values, dueDate: event.currentTarget.value })} className={inputClass} />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="project-description" className={labelClass}>Description</label>
              <Textarea id="project-description" name="description" value={values.description} onChange={(event) => setValues({ ...values, description: event.currentTarget.value })} rows={4} maxLength={2000} placeholder="What are we delivering, and what is the goal?" className="min-h-[120px] border-[var(--line)] bg-[var(--surface)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent)]/20 dark:bg-[var(--surface)]" />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="project-notes" className={labelClass}>Notes</label>
              <Textarea id="project-notes" name="notes" value={values.notes} onChange={(event) => setValues({ ...values, notes: event.currentTarget.value })} rows={4} maxLength={5000} placeholder="Internal notes, scope context, and delivery reminders." className="min-h-[120px] border-[var(--line)] bg-[var(--surface)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent)]/20 dark:bg-[var(--surface)]" />
            </div>
          </div>

          {state.error && (
            <div role="alert" className="rounded-lg border border-[var(--danger-border)]/20 bg-[var(--danger)]/[0.08] px-3 py-2 text-sm text-[#fca5a5]">
              {state.error}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[var(--line)] pt-4 sm:flex-row sm:justify-end">
            <Dialog.Close asChild>
              <button type="button" disabled={pending} className="h-10 rounded-lg px-4 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] disabled:opacity-50">Cancel</button>
            </Dialog.Close>
            <button type="submit" disabled={pending || !values.name.trim() || !values.clientId} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55">
              {pending ? (project ? "Saving…" : "Creating…") : project ? "Save Project" : "Create Project"}
            </button>
          </div>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

function formatDateInput(value: string | Date | undefined) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}
