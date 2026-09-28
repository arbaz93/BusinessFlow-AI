"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { ArrowRight, Check, X } from "lucide-react";
import { convertLead } from "@/app/actions/leads";

export function LeadConversionDialog({
  leadId,
  name,
  company,
  email,
  phone,
  estimatedValue,
  currency,
}: {
  leadId: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  estimatedValue: string | null;
  currency: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const submissionLocked = useRef(false);

  function handleOpenChange(value: boolean) {
    if (pending) return;
    setOpen(value);
    if (value) setError(null);
  }

  function handleConvert() {
    if (submissionLocked.current) return;
    submissionLocked.current = true;
    startTransition(async () => {
      const result = await convertLead(leadId);
      if (result.error) {
        submissionLocked.current = false;
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button type="button" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#22c55e] px-4 text-sm font-semibold text-[#07120a] transition-colors hover:bg-[#4ade80] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86efac] disabled:opacity-50">
          <Check size={16} />
          Convert to Client
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-[#18181b] p-5 text-white shadow-2xl outline-none sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-[#f4f4f5]">Convert lead to client?</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-6 text-white/55">
                This will create a client record using the lead&apos;s existing information. The original lead will be retained and marked as Won.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close dialog" className="grid size-9 shrink-0 place-items-center rounded-lg text-white/55 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]">
                <X size={17} />
              </button>
            </Dialog.Close>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-white/8 bg-[#111113] p-3.5 text-sm">
            <SummaryItem label="Name" value={name} />
            <SummaryItem label="Company" value={company} />
            <SummaryItem label="Email" value={email} />
            <SummaryItem label="Phone" value={phone} />
            {estimatedValue !== null && <SummaryItem label="Estimated value" value={new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(estimatedValue))} />}
          </dl>
          {error && <p role="alert" className="mt-4 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/[0.08] px-3 py-2 text-sm text-[#fca5a5]">{error}</p>}
          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-white/8 pt-4 sm:flex-row sm:justify-end">
            <Dialog.Close asChild>
              <button type="button" disabled={pending} className="h-10 rounded-lg px-4 text-sm font-medium text-white/65 transition-colors hover:bg-white/[0.05] hover:text-white disabled:opacity-50">Cancel</button>
            </Dialog.Close>
            <button type="button" onClick={handleConvert} disabled={pending} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#22c55e] px-4 text-sm font-semibold text-[#07120a] transition-colors hover:bg-[#4ade80] disabled:cursor-not-allowed disabled:opacity-55">
              {pending ? "Converting…" : <>Confirm Conversion <ArrowRight size={15} /></>}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SummaryItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-white/40">{label}</dt>
      <dd className="mt-0.5 truncate text-xs font-medium text-white/80">{value || "Not provided"}</dd>
    </div>
  );
}