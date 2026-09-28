"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { Pencil, Plus, X } from "lucide-react";
import { saveClient } from "@/app/actions/clients";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { clientStatusSchema, clientStatusValues, type ClientInput } from "@/lib/clients/schemas";

type ClientDraft = ClientInput & { id: string; updatedAt: string };

export function ClientFormDialog({ client, label }: { client?: ClientDraft; label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className={client
          ? "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#18181b] px-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]"
          : "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#7067e8] px-4 text-sm font-medium text-white transition-colors hover:bg-[#8178f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]"}>
          {client ? <Pencil size={15} /> : <Plus size={16} />}
          {client ? "Edit Client" : label ?? "New Client"}
        </button>
      </Dialog.Trigger>
      {open && <ClientForm client={client} onClose={() => setOpen(false)} />}
    </Dialog.Root>
  );
}

function ClientForm({ client, onClose }: { client?: ClientDraft; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(saveClient, {});
  const [values, setValues] = useState({
    name: client?.name ?? "",
    company: client?.company ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    status: client?.status ?? "ACTIVE",
    notes: client?.notes ?? "",
  });
  const submissionLocked = useRef(false);

  useEffect(() => {
    if (state.success) onClose();
  }, [onClose, state.success]);

  useEffect(() => {
    if (!pending) submissionLocked.current = false;
  }, [pending]);

  function fieldError(field: keyof ClientInput) {
    return state.fieldErrors?.[field]?.[0];
  }

  const inputClass = "h-10 border-white/10 bg-[#111113] text-sm text-white placeholder:text-white/30 focus-visible:border-[#a49bff] focus-visible:ring-[#a49bff]/20 dark:bg-[#111113]";
  const selectClass = "h-10 w-full rounded-md border border-white/10 bg-[#111113] px-3 text-sm text-white outline-none focus-visible:border-[#a49bff] focus-visible:ring-[3px] focus-visible:ring-[#a49bff]/20";
  const labelClass = "mb-1.5 block text-xs font-medium text-white/70";

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px]" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-white/10 bg-[#18181b] p-5 text-white shadow-2xl outline-none sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Dialog.Title className="text-lg font-semibold tracking-[-0.02em] text-[#f4f4f5]">{client ? "Edit Client" : "New Client"}</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-white/50">{client ? "Update contact details and ongoing client context." : "Add a client relationship to your workspace."}</Dialog.Description>
          </div>
          <Dialog.Close asChild>
            <button type="button" aria-label="Close dialog" className="grid size-9 shrink-0 place-items-center rounded-lg text-white/55 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]"><X size={17} /></button>
          </Dialog.Close>
        </div>

        <form action={formAction} onSubmit={(event) => {
          if (submissionLocked.current) {
            event.preventDefault();
            return;
          }
          submissionLocked.current = true;
        }} className="mt-6 space-y-4">
          {client && <input type="hidden" name="clientId" value={client.id} />}
          {client && <input type="hidden" name="expectedUpdatedAt" value={client.updatedAt} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-white/45 sm:col-span-2">Contact information</h3>
            <div className="sm:col-span-2">
              <label htmlFor="client-name" className={labelClass}>Name <span className="text-[#fca5a5]">*</span></label>
              <Input id="client-name" name="name" autoComplete="name" required maxLength={100} value={values.name} onChange={(event) => setValues({ ...values, name: event.currentTarget.value })} aria-invalid={Boolean(fieldError("name"))} aria-describedby={fieldError("name") ? "client-name-error" : undefined} className={inputClass} />
              {fieldError("name") && <p id="client-name-error" className="mt-1 text-xs text-[#fca5a5]">{fieldError("name")}</p>}
            </div>
            <div>
              <label htmlFor="client-company" className={labelClass}>Company</label>
              <Input id="client-company" name="company" autoComplete="organization" maxLength={120} value={values.company} onChange={(event) => setValues({ ...values, company: event.currentTarget.value })} aria-invalid={Boolean(fieldError("company"))} aria-describedby={fieldError("company") ? "client-company-error" : undefined} className={inputClass} />
              {fieldError("company") && <p id="client-company-error" className="mt-1 text-xs text-[#fca5a5]">{fieldError("company")}</p>}
            </div>
            <div>
              <label htmlFor="client-email" className={labelClass}>Email <span className="text-[#fca5a5]">*</span></label>
              <Input id="client-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="name@company.com" value={values.email} onChange={(event) => setValues({ ...values, email: event.currentTarget.value })} aria-invalid={Boolean(fieldError("email"))} aria-describedby={fieldError("email") ? "client-email-error" : undefined} className={inputClass} />
              {fieldError("email") && <p id="client-email-error" className="mt-1 text-xs text-[#fca5a5]">{fieldError("email")}</p>}
            </div>
            <div>
              <label htmlFor="client-phone" className={labelClass}>Phone</label>
              <Input id="client-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} placeholder="+1 555 010 0200" value={values.phone} onChange={(event) => setValues({ ...values, phone: event.currentTarget.value })} aria-invalid={Boolean(fieldError("phone"))} aria-describedby={fieldError("phone") ? "client-phone-error" : undefined} className={inputClass} />
              {fieldError("phone") && <p id="client-phone-error" className="mt-1 text-xs text-[#fca5a5]">{fieldError("phone")}</p>}
            </div>

            <h3 className="mt-2 border-t border-white/[0.07] pt-4 text-xs font-semibold uppercase tracking-[0.12em] text-white/45 sm:col-span-2">Client information</h3>
            <div>
              <label htmlFor="client-status" className={labelClass}>Status</label>
              <select id="client-status" name="status" value={values.status} onChange={(event) => {
                const status = clientStatusSchema.safeParse(event.currentTarget.value);
                if (status.success) setValues({ ...values, status: status.data });
              }} aria-invalid={Boolean(fieldError("status"))} aria-describedby={fieldError("status") ? "client-status-error" : undefined} className={selectClass}>
                {clientStatusValues.map((status) => <option key={status} value={status}>{status === "ACTIVE" ? "Active" : "Inactive"}</option>)}
              </select>
              {fieldError("status") && <p id="client-status-error" className="mt-1 text-xs text-[#fca5a5]">{fieldError("status")}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="client-notes" className={labelClass}>Notes</label>
              <Textarea id="client-notes" name="notes" rows={4} maxLength={5000} placeholder="Ongoing context, preferences, and relationship notes…" value={values.notes} onChange={(event) => setValues({ ...values, notes: event.currentTarget.value })} aria-invalid={Boolean(fieldError("notes"))} aria-describedby={fieldError("notes") ? "client-notes-error" : undefined} className="min-h-24 resize-y border-white/10 bg-[#111113] text-sm text-white placeholder:text-white/30 focus-visible:border-[#a49bff] focus-visible:ring-[#a49bff]/20 dark:bg-[#111113]" />
              {fieldError("notes") && <p id="client-notes-error" className="mt-1 text-xs text-[#fca5a5]">{fieldError("notes")}</p>}
            </div>
          </div>

          {state.error && <p role="alert" className="rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/[0.08] px-3 py-2 text-sm text-[#fca5a5]">{state.error}</p>}

          <div className="flex flex-col-reverse gap-2 border-t border-white/8 pt-4 sm:flex-row sm:justify-end">
            <Dialog.Close asChild><button type="button" className="h-10 rounded-lg px-4 text-sm font-medium text-white/65 transition-colors hover:bg-white/[0.05] hover:text-white">Cancel</button></Dialog.Close>
            <button type="submit" disabled={pending} className="h-10 rounded-lg bg-[#7067e8] px-4 text-sm font-medium text-white transition-colors hover:bg-[#8178f0] disabled:cursor-not-allowed disabled:opacity-55">{pending ? "Saving…" : client ? "Save Changes" : "Create Client"}</button>
          </div>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  );
}