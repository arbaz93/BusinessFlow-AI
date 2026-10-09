"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeLeadStatus } from "@/app/actions/leads";
import { leadStatusLabels } from "@/lib/leads/options";
import { leadEditableStatusSchema } from "@/lib/leads/schemas";

export type LeadStatusValue = keyof typeof leadStatusLabels;

const editableStatuses: LeadStatusValue[] = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "WON", "LOST"];

export function LeadStatusControl({ leadId, initialStatus, readOnly = false }: { leadId: string; initialStatus: LeadStatusValue; readOnly?: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleChange(value: string) {
    const parsedStatus = leadEditableStatusSchema.safeParse(value);
    if (!parsedStatus.success || parsedStatus.data === status) return;
    const previous = status;
    setStatus(parsedStatus.data);
    setError(null);
    startTransition(async () => {
      const result = await changeLeadStatus(leadId, parsedStatus.data, previous);
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
      <label className="sr-only" htmlFor={`lead-status-${leadId}`}>Lead status</label>
      <select
        id={`lead-status-${leadId}`}
        value={status}
        disabled={pending || readOnly}
        onChange={(event) => handleChange(event.target.value)}
        className="h-9 max-w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2.5 text-xs font-medium text-[var(--foreground)]/85 outline-none transition-colors hover:border-[var(--line-strong)] focus-visible:ring-2 focus-visible:ring-[#a49bff] disabled:opacity-55"
      >
        {editableStatuses.map((item) => <option key={item} value={item}>{leadStatusLabels[item]}</option>)}
      </select>
      {error && <p role="alert" className="mt-1 max-w-44 text-[11px] leading-4 text-[#fca5a5]">{error}</p>}
    </div>
  );
}