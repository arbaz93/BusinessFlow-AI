"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DropdownMenu } from "radix-ui";
import { MoreHorizontal, Trash2, X } from "lucide-react";
import { changeClientStatus, deleteClient } from "@/app/actions/clients";
import type { ClientInput } from "@/lib/clients/schemas";

export function ClientActionsMenu({
  clientId,
  name,
  company,
  email,
  status,
}: {
  clientId: string;
  name: string;
  company: string | null;
  email: string | null;
  status: ClientInput["status"];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const nextStatus = status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  function handleStatusChange() {
    setError(null);
    startTransition(async () => {
      const result = await changeClientStatus(clientId, nextStatus, status);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button type="button" aria-label="More client actions" className="grid size-10 place-items-center rounded-lg border border-[var(--line)] bg-[var(--panel)] text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
            <MoreHorizontal size={18} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={6} className="z-70 min-w-48 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-1.5 text-sm text-[var(--foreground)] shadow-xl outline-none">
            <DropdownMenu.Item onSelect={(event) => { event.preventDefault(); handleStatusChange(); }} disabled={pending} className="flex h-9 cursor-pointer items-center rounded-md px-2.5 text-[var(--foreground)] outline-none transition-colors hover:bg-[var(--surface)] focus:bg-[var(--surface)] data-[disabled]:opacity-50">
              {pending ? "Updating…" : status === "ACTIVE" ? "Deactivate Client" : "Reactivate Client"}
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 h-px bg-[var(--surface)]" />
            <DropdownMenu.Item onSelect={() => setDeleteOpen(true)} disabled={pending} className="flex h-9 cursor-pointer items-center gap-2 rounded-md px-2.5 text-[#fca5a5] outline-none transition-colors hover:bg-[var(--danger)]/[0.08] focus:bg-[var(--danger)]/[0.08] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50">
              <Trash2 size={14} /> Delete Client
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      {error && <p role="alert" className="fixed right-4 top-20 z-50 w-64 rounded-lg border border-[var(--danger-border)]/20 bg-[var(--panel)] p-2 text-xs text-[#fca5a5] shadow-lg">{error}</p>}
      <ClientDeleteDialog
        clientId={clientId}
        name={name}
        company={company}
        email={email}
        status={status}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}

function ClientDeleteDialog({
  clientId,
  name,
  company,
  email,
  status,
  open,
  onOpenChange,
}: {
  clientId: string;
  name: string;
  company: string | null;
  email: string | null;
  status: ClientInput["status"];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [dependencyCount, setDependencyCount] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const submissionLocked = useRef(false);

  useEffect(() => {
    if (!pending) submissionLocked.current = false;
  }, [pending]);

  function handleOpenChange(value: boolean) {
    if (pending) return;
    onOpenChange(value);
    if (value) {
      setError(null);
      setDependencyCount(null);
    }
  }

  function handleDelete() {
    if (submissionLocked.current) return;
    submissionLocked.current = true;
    startTransition(async () => {
      const result = await deleteClient(clientId);
      if (result.error) {
        setError(result.error);
        setDependencyCount(result.dependencyCount ?? null);
        return;
      }
      onOpenChange(false);
      router.replace("/clients?deleted=1");
      router.refresh();
    });
  }

  function handleDeactivate() {
    if (submissionLocked.current) return;
    submissionLocked.current = true;
    startTransition(async () => {
      const result = await changeClientStatus(clientId, "INACTIVE", status);
      if (result.error) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5 text-[var(--foreground)] shadow-2xl outline-none sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-[var(--foreground)]">Delete this client?</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--muted)]">This will permanently delete this client if no business history depends on it. This action cannot be undone.</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" disabled={pending} aria-label="Close dialog" className="grid size-9 shrink-0 place-items-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50">
                <X size={17} />
              </button>
            </Dialog.Close>
          </div>

          <dl className="mt-5 space-y-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3.5 py-3">
            <DeleteDetail label="Client" value={name} />
            <DeleteDetail label="Company" value={company} />
            <DeleteDetail label="Email" value={email} />
          </dl>

          {error && (
            <div role="alert" className="mt-4 rounded-lg border border-[var(--danger-border)]/20 bg-[var(--danger)]/[0.08] px-3 py-2 text-sm text-[#fca5a5]">
              <p>{error}</p>
              {dependencyCount !== null && status === "ACTIVE" && (
                <button type="button" onClick={handleDeactivate} disabled={pending} className="mt-3 h-9 rounded-md bg-[var(--accent)] px-3 text-xs font-medium text-[var(--foreground)] transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55">
                  {pending ? "Deactivating…" : "Deactivate Client"}
                </button>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[var(--line)] pt-4 sm:flex-row sm:justify-end">
            <Dialog.Close asChild>
              <button type="button" disabled={pending} className="h-10 rounded-lg px-4 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] disabled:opacity-50">Cancel</button>
            </Dialog.Close>
            {dependencyCount === null && (
              <button type="button" onClick={handleDelete} disabled={pending} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#dc2626] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#ef4444] disabled:cursor-not-allowed disabled:opacity-55">
                <Trash2 size={15} />{pending ? "Deleting…" : "Delete Client"}
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DeleteDetail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 text-sm">
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="truncate font-medium text-[var(--foreground)]">{value || "Not provided"}</dd>
    </div>
  );
}