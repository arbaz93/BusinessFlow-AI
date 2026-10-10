"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { Pencil, Plus, X } from "lucide-react";
import { saveLead } from "@/app/actions/leads";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { currencyValues, leadSourceLabels, leadSourceValues, leadStatusLabels, leadStatusValues } from "@/lib/leads/options";
import type { LeadInput } from "@/lib/leads/schemas";

type LeadDraft = LeadInput & { id: string; updatedAt: string };
type LeadFormValues = Omit<LeadInput, "source"> & { source: string };

export function LeadFormDialog({ lead }: { lead?: LeadDraft }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={lead
            ? "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            : "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"}
        >
          {lead ? <Pencil size={15} /> : <Plus size={16} />}
          {lead ? "Edit details" : "New lead"}
        </button>
      </Dialog.Trigger>
      {open && <LeadForm lead={lead} onClose={() => setOpen(false)} />}
    </Dialog.Root>
  );
}

function LeadForm({ lead, onClose }: { lead?: LeadDraft; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(saveLead, {});
  const [values, setValues] = useState<LeadFormValues>(() => lead ? {
    name: lead.name,
    company: lead.company ?? "",
    source: lead.source,
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    notes: lead.notes ?? "",
    status: lead.status,
    estimatedValue: lead.estimatedValue,
    currency: lead.currency,
  } : {
    name: "",
    company: "",
    source: "",
    email: "",
    phone: "",
    notes: "",
    status: "NEW",
    estimatedValue: undefined,
    currency: "USD",
  });
  const submissionLocked = useRef(false);

  useEffect(() => {
    if (state.success) onClose();
  }, [onClose, state.success]);

  useEffect(() => {
    if (!pending) submissionLocked.current = false;
  }, [pending]);

  function fieldError(name: keyof LeadInput) {
    return state.fieldErrors?.[name]?.[0];
  }

  const inputClass = "h-10 border-[var(--line)] bg-[var(--surface)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent)]/20";
  const selectClass = "h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus-visible:border-[var(--accent)] focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]/20";
  const labelClass = "mb-1.5 block text-xs font-medium text-[var(--muted)]";

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px]" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5 text-[var(--foreground)] shadow-2xl outline-none sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Dialog.Title className="text-lg font-semibold tracking-[-0.02em] text-[var(--foreground)]">
              {lead ? "Edit lead" : "Create a lead"}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-[var(--foreground)]/50">
              Keep the essentials together so your next step is clear.
            </Dialog.Description>
          </div>
          <Dialog.Close asChild>
            <button type="button" aria-label="Close dialog" className="grid size-9 shrink-0 place-items-center rounded-lg text-[var(--foreground)]/55 transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
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
          {lead && <input type="hidden" name="leadId" value={lead.id} />}
          {lead && <input type="hidden" name="expectedUpdatedAt" value={lead.updatedAt} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground)]/45 sm:col-span-2">Contact information</h3>
            <div className="sm:col-span-2">
              <label htmlFor="lead-name" className={labelClass}>Name <span className="text-[#fca5a5]">*</span></label>
              <Input id="lead-name" name="name" autoComplete="name" required maxLength={100} value={values.name} onChange={(event) => setValues({ ...values, name: event.currentTarget.value })} aria-invalid={Boolean(fieldError("name"))} aria-describedby={fieldError("name") ? "lead-name-error" : undefined} className={inputClass} />
              {fieldError("name") && <p id="lead-name-error" className="mt-1 text-xs text-[#fca5a5]">{fieldError("name")}</p>}
            </div>
            <div>
              <label htmlFor="lead-company" className={labelClass}>Company</label>
              <Input id="lead-company" name="company" autoComplete="organization" maxLength={120} value={values.company ?? ""} onChange={(event) => setValues({ ...values, company: event.currentTarget.value })} aria-invalid={Boolean(fieldError("company"))} aria-describedby={fieldError("company") ? "lead-company-error" : undefined} className={inputClass} />
              {fieldError("company") && <p id="lead-company-error" className="mt-1 text-xs text-[#fca5a5]">{fieldError("company")}</p>}
            </div>
            <div>
              <label htmlFor="lead-email" className={labelClass}>Email <span className="text-[#fca5a5]">*</span></label>
              <Input id="lead-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="name@company.com" value={values.email} onChange={(event) => setValues({ ...values, email: event.currentTarget.value })} aria-invalid={Boolean(fieldError("email"))} aria-describedby={fieldError("email") ? "lead-email-error" : undefined} className={inputClass} />
              {fieldError("email") && <p id="lead-email-error" className="mt-1 text-xs text-[#fca5a5]">{fieldError("email")}</p>}
            </div>
            <div>
              <label htmlFor="lead-phone" className={labelClass}>Phone</label>
              <Input id="lead-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} placeholder="+1 555 010 0200" value={values.phone ?? ""} onChange={(event) => setValues({ ...values, phone: event.currentTarget.value })} aria-invalid={Boolean(fieldError("phone"))} aria-describedby={fieldError("phone") ? "lead-phone-error" : undefined} className={inputClass} />
              {fieldError("phone") && <p id="lead-phone-error" className="mt-1 text-xs text-[#fca5a5]">{fieldError("phone")}</p>}
            </div>

            <h3 className="mt-2 border-t border-[var(--line)] pt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground)]/45 sm:col-span-2">Lead details</h3>
            <div>
              <label htmlFor="lead-source" className={labelClass}>Source <span className="text-[#fca5a5]">*</span></label>
              <select id="lead-source" name="source" required value={values.source} onChange={(event) => {
                const source = leadSourceValues.find((candidate) => candidate === event.currentTarget.value);
                if (source) setValues({ ...values, source });
              }} aria-invalid={Boolean(fieldError("source"))} aria-describedby={fieldError("source") ? "lead-source-error" : undefined} className={selectClass}>
                <option value="" disabled>Select a source</option>
                {leadSourceValues.map((source) => <option key={source} value={source}>{leadSourceLabels[source]}</option>)}
              </select>
              {fieldError("source") && <p id="lead-source-error" className="mt-1 text-xs text-[#fca5a5]">{fieldError("source")}</p>}
            </div>
            <div>
              <label htmlFor="lead-status" className={labelClass}>Status</label>
              <select id="lead-status" name="status" value={values.status} onChange={(event) => {
                const status = leadStatusValues.find((candidate) => candidate === event.currentTarget.value);
                if (status) setValues({ ...values, status });
              }} aria-invalid={Boolean(fieldError("status"))} aria-describedby={fieldError("status") ? "lead-status-error" : undefined} className={selectClass}>
                {leadStatusValues.map((status) => <option key={status} value={status}>{leadStatusLabels[status]}</option>)}
              </select>
              {fieldError("status") && <p id="lead-status-error" className="mt-1 text-xs text-[#fca5a5]">{fieldError("status")}</p>}
            </div>
            <div>
              <label htmlFor="lead-estimated-value" className={labelClass}>Estimated value</label>
              <Input id="lead-estimated-value" name="estimatedValue" type="number" inputMode="decimal" min="0" max="9999999999.99" step="0.01" placeholder="0.00" value={values.estimatedValue ?? ""} onChange={(event) => setValues({ ...values, estimatedValue: event.currentTarget.value === "" ? undefined : Number(event.currentTarget.value) })} aria-invalid={Boolean(fieldError("estimatedValue"))} aria-describedby={fieldError("estimatedValue") ? "lead-estimated-value-error" : undefined} className={inputClass} />
              {fieldError("estimatedValue") && <p id="lead-estimated-value-error" className="mt-1 text-xs text-[#fca5a5]">{fieldError("estimatedValue")}</p>}
            </div>
            <div>
              <label htmlFor="lead-currency" className={labelClass}>Currency</label>
              <select id="lead-currency" name="currency" value={values.currency} onChange={(event) => {
                const currency = currencyValues.find((candidate) => candidate === event.currentTarget.value);
                if (currency) setValues({ ...values, currency });
              }} aria-invalid={Boolean(fieldError("currency"))} aria-describedby={fieldError("currency") ? "lead-currency-error" : undefined} className={selectClass}>
                {currencyValues.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
              </select>
              {fieldError("currency") && <p id="lead-currency-error" className="mt-1 text-xs text-[#fca5a5]">{fieldError("currency")}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="lead-notes" className={labelClass}>Notes</label>
              <Textarea id="lead-notes" name="notes" rows={3} maxLength={2000} placeholder="Add context for the next conversation…" value={values.notes ?? ""} onChange={(event) => setValues({ ...values, notes: event.currentTarget.value })} aria-invalid={Boolean(fieldError("notes"))} aria-describedby={fieldError("notes") ? "lead-notes-error" : undefined} className="min-h-24 resize-y border-[var(--line)] bg-[var(--surface)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent)]/20 dark:bg-[var(--surface)]" />
              {fieldError("notes") && <p id="lead-notes-error" className="mt-1 text-xs text-[#fca5a5]">{fieldError("notes")}</p>}
            </div>
          </div>

          {state.error && <p role="alert" className="rounded-lg border border-[var(--danger-border)]/20 bg-[var(--danger)]/[0.08] px-3 py-2 text-sm text-[#fca5a5]">{state.error}</p>}

          <div className="flex flex-col-reverse gap-2 border-t border-[var(--line)] pt-4 sm:flex-row sm:justify-end">
            <Dialog.Close asChild>
              <button type="button" className="h-10 rounded-lg px-4 text-sm font-medium text-[var(--foreground)]/65 transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]">Cancel</button>
            </Dialog.Close>
            <button type="submit" disabled={pending} className="h-10 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55">
              {pending ? "Saving…" : lead ? "Save Changes" : "Create Lead"}
            </button>
          </div>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  );
}