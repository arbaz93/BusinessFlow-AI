"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { Trash2, X } from "lucide-react";
import { deleteTask } from "@/app/actions/tasks";

export function TaskDeleteDialog({
  taskId,
  title,
  projectName,
  redirectTo = "/tasks?deleted=1",
}: {
  taskId: string;
  title: string;
  projectName: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const submissionLocked = useRef(false);

  function handleOpenChange(value: boolean) {
    if (pending) return;
    setOpen(value);
    if (value) {
      setError(null);
      submissionLocked.current = false;
    }
  }

  function handleDelete() {
    if (submissionLocked.current) return;
    submissionLocked.current = true;

    startTransition(async () => {
      const result = await deleteTask(taskId);
      if (result.error) {
        submissionLocked.current = false;
        setError(result.error);
        return;
      }
      setOpen(false);
      router.replace(redirectTo);
      router.refresh();
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button type="button" aria-label="Delete task" className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 text-xs font-medium text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]">
          <Trash2 size={14} />
          <span className="hidden sm:inline">Delete</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5 text-[var(--foreground)] shadow-2xl outline-none sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-[var(--foreground)]">Delete this task?</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--muted)]">This will permanently delete the task and remove it from the project timeline. This action cannot be undone.</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" disabled={pending} aria-label="Close dialog" className="grid size-9 shrink-0 place-items-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff] disabled:opacity-50">
                <X size={17} />
              </button>
            </Dialog.Close>
          </div>

          <div className="mt-5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3.5 py-3">
            <p className="truncate text-sm font-medium text-[var(--foreground)]">{title}</p>
            <p className="mt-1 truncate text-xs text-[var(--muted)]">{projectName}</p>
          </div>

          {error && <p role="alert" className="mt-4 rounded-lg border border-[var(--danger-border)]/20 bg-[var(--danger)]/[0.08] px-3 py-2 text-sm leading-5 text-[#fca5a5]">{error}</p>}

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[var(--line)] pt-4 sm:flex-row sm:justify-end">
            <Dialog.Close asChild>
              <button type="button" disabled={pending} className="h-10 rounded-lg px-4 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] disabled:opacity-50">Cancel</button>
            </Dialog.Close>
            <button type="button" onClick={handleDelete} disabled={pending} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#dc2626] px-4 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[#ef4444] disabled:cursor-not-allowed disabled:opacity-55">
              <Trash2 size={15} />{pending ? "Deleting…" : "Delete Task"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
