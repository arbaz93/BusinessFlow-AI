import { MockupFrame } from "./MockupFrame";
import { mockLead, stageStyles } from "./mockupData";
import { cn } from "@/lib/utils";

interface LeadsListMockupProps {
  className?: string;
}

export function LeadsListMockup({ className }: LeadsListMockupProps) {
  return (
    <MockupFrame title="Leads" subtitle="/leads" className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">All Leads</h3>
          <div className="flex items-center gap-2">
            <select className="text-[11px] bg-[var(--surface)] border border-[var(--line)] rounded px-2 py-1 text-[var(--foreground)]">
              <option>All stages</option>
              <option>New</option>
              <option>Qualified</option>
              <option>Proposal</option>
            </select>
            <button className="text-[11px] font-medium text-[var(--accent)] hover:text-[var(--accent-muted)]">
              Add Lead
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--background)]">
                <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">Name</th>
                <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">Company</th>
                <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">Stage</th>
                <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">Source</th>
                <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">Created</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--line)] hover:bg-[var(--background)]/50">
                <td className="px-3 py-2 font-medium text-[var(--foreground)]">{mockLead.name}</td>
                <td className="px-3 py-2 text-[var(--muted)]">{mockLead.company}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${stageStyles[mockLead.stage]}`}>
                    {mockLead.stage}
                  </span>
                </td>
                <td className="px-3 py-2 text-[var(--muted)]">{mockLead.source}</td>
                <td className="px-3 py-2 text-[var(--muted-foreground)]">{mockLead.date}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-4 pt-2">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">Lead Detail — Northstar Studio</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-medium text-[var(--muted)]">Contact</p>
                <p className="mt-1 text-sm text-[var(--foreground)]">{mockLead.name}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-[var(--muted)]">Email</p>
                <p className="mt-1 text-sm text-[var(--foreground)]">{mockLead.email}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-[var(--muted)]">Phone</p>
                <p className="mt-1 text-sm text-[var(--foreground)]">{mockLead.phone}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-[var(--muted)]">Source</p>
                <p className="mt-1 text-sm text-[var(--foreground)]">{mockLead.source}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2">Notes</h4>
            <p className="text-sm leading-6 text-[var(--muted)]">{mockLead.notes}</p>
          </div>

          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-[var(--muted)]">Estimated Value</p>
                <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">${mockLead.estimatedValue.toLocaleString()}</p>
              </div>
              <button className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#22c55e] px-3 text-sm font-semibold text-[#07120a] hover:bg-[#4ade80]">
                Convert to Client
              </button>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-[var(--muted-foreground)]">Showing 1 of 24 leads</p>
      </div>
    </MockupFrame>
  );
}