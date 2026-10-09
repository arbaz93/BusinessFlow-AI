import { MockupFrame } from "./MockupFrame";
import { mockLead, mockClient, stageStyles } from "./mockupData";
import { ArrowRight, ArrowDown, Check, Building2, CalendarDays, Mail, Phone, UserRound, CircleDollarSign } from "lucide-react";

interface LeadConvertMockupProps {
  className?: string;
}

export function LeadConvertMockup({ className }: LeadConvertMockupProps) {
  return (
    <MockupFrame title="Lead → Client Conversion" subtitle="/leads/northstar-studio" className={className} showChrome={false}>
      <div className="space-y-4">
        {/* Lead → Client Conversion Cards */}
        <div className="flex flex-col gap-4 items-center justify-between">
          <div className="flex flex-col w-full justify-center gap-3 sm:flex-row sm:items-center sm:gap-4 min-w-0">
            {/* Lead Card */}
            <div className="flex flex-col gap-2 p-4 rounded-lg border border-[var(--line)] bg-[var(--surface)] w-full sm:max-w-[280px] min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-muted)]">Lead</span>
                <span className={`inline-flex h-5 items-center rounded-full border px-2 text-[10px] font-medium ${stageStyles[mockLead.stage]}`}>
                  {mockLead.stage}
                </span>
              </div>
              <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--foreground)] truncate">{mockLead.name}</h3>
              <p className="text-xs text-[var(--muted)] truncate">{mockLead.company} <span className="mx-1.5 text-[var(--foreground)]/20">·</span> Added {mockLead.date}</p>
            </div>

            {/* Conversion Arrow - horizontal on desktop, vertical on mobile */}
            <div className="flex items-center justify-center sm:flex-none">
              <ArrowRight size={24} className="text-[var(--accent)] flex-shrink-0 hidden sm:block" aria-hidden="true" />
              <ArrowDown size={24} className="text-[var(--accent)] flex-shrink-0 sm:hidden" aria-hidden="true" />
            </div>

            {/* Client Card */}
            <div className="flex flex-col gap-2 p-4 rounded-lg border border-[var(--success)]/20 bg-[var(--success)]/5 w-full sm:max-w-[280px] min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--success)]">Client</span>
                <span className="inline-flex h-5 items-center rounded-full border px-2 text-[10px] font-medium bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20">
                  ACTIVE
                </span>
              </div>
              <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--foreground)] truncate">{mockClient.name}</h3>
              <p className="text-xs text-[var(--muted)] truncate">Converted from Lead <span className="mx-1.5 text-[var(--foreground)]/20">·</span> Just now</p>
            </div>
          </div>

          {/* Conversion Confirmation Panel */}
          <div className="rounded-lg border border-[var(--success)]/15 bg-[var(--success)]/5 p-4 w-full">
            <div className="flex items-center gap-2 text-sm">
              <Check size={14} className="text-[var(--success)] flex-shrink-0" />
              <span className="font-semibold text-[var(--foreground)]">Lead converted to client</span>
            </div>
            <p className="mt-1 max-w-xl text-xs leading-5 text-[var(--muted)]">The lead was converted. The original lead record is retained with Won status. All context preserved.</p>
          </div>
        </div>

        {/* Details Grid - Contact Info, Notes, Activity */}
        <div className="flex flex-col gap-4">
          <section className="space-y-4 min-w-0">
            <div className="rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5">
              <h4 className="text-[15px] font-semibold text-[var(--foreground)]">Contact information</h4>
              <div className="mt-3 grid gap-x-5 gap-y-4 sm:grid-cols-2">
                <ContactItem icon={UserRound} label="Name" value={mockClient.contact} />
                <ContactItem icon={Building2} label="Company" value={mockClient.company} />
                <ContactItem icon={Mail} label="Email" value={mockClient.email} href={`mailto:${mockClient.email}`} />
                <ContactItem icon={Phone} label="Phone" value={mockClient.phone} />
                <ContactItem icon={CalendarDays} label="Lead source" value="Referral" />
                <ContactItem icon={CircleDollarSign} label="Estimated value" value="$8,500" />
                <ContactItem icon={CalendarDays} label="Converted" value="Jan 12" />
              </div>
            </div>

            <div className="rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5">
              <h4 className="text-[15px] font-semibold text-[var(--foreground)]">Notes</h4>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{mockLead.notes}</p>
            </div>
          </section>

          <aside className="rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-[15px] font-semibold text-[var(--foreground)]">Activity</h4>
                <p className="mt-1 text-[11px] text-[var(--muted)]">Changes made to this lead.</p>
              </div>
              <span className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-[11px] text-[var(--muted)] shrink-0">3</span>
            </div>
            <ol className="mt-4 space-y-0">
              <li className="relative flex gap-3 pb-4 min-w-0">
                <span className="absolute left-[5px] top-3 h-full w-px bg-[var(--surface)]" />
                <span className="relative mt-1 size-3 shrink-0 rounded-full border-2 border-[var(--accent)]/50 bg-[var(--panel)]" />
                <div className="min-w-0">
                  <p className="text-[13px] leading-5 text-[var(--foreground)] truncate">Lead created</p>
                  <p className="mt-1 text-[11px] text-[var(--muted)]">System <span className="mx-1 text-[var(--foreground)]/20">·</span> {mockLead.date}</p>
                </div>
              </li>
              <li className="relative flex gap-3 pb-4 min-w-0">
                <span className="absolute left-[5px] top-3 h-full w-px bg-[var(--surface)]" />
                <span className="relative mt-1 size-3 shrink-0 rounded-full border-2 border-[var(--accent)]/50 bg-[var(--panel)]" />
                <div className="min-w-0">
                  <p className="text-[13px] leading-5 text-[var(--foreground)] truncate">Stage changed to Qualified</p>
                  <p className="mt-1 text-[11px] text-[var(--muted)]">Sarah Mitchell <span className="mx-1 text-[var(--foreground)]/20">·</span> Jan 11</p>
                </div>
              </li>
              <li className="relative flex gap-3 min-w-0">
                <span className="relative mt-1 size-3 shrink-0 rounded-full border-2 border-[var(--success)]/50 bg-[var(--panel)]" />
                <div className="min-w-0">
                  <p className="text-[13px] leading-5 text-[var(--foreground)] truncate">Converted to Client</p>
                  <p className="mt-1 text-[11px] text-[var(--muted)]">System <span className="mx-1 text-[var(--foreground)]/20">·</span> Jan 12</p>
                </div>
              </li>
            </ol>
          </aside>
        </div>
      </div>
    </MockupFrame>
  );
}

function ContactItem({ icon: Icon, label, value, href }: { icon: typeof UserRound; label: string; value: string | null; href?: string }) {
  return (
    <div className="flex min-w-0 gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"><Icon size={15} /></span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-[var(--muted)]">{label}</p>
        {href && value ? <a href={href} className="mt-1 block truncate text-sm text-[var(--foreground)] hover:text-[var(--accent-muted)]">{value}</a> : <p className="mt-1 truncate text-sm text-[var(--foreground)]">{value || "Not provided"}</p>}
      </div>
    </div>
  );
}