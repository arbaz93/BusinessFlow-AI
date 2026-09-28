import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, CalendarDays, CircleDollarSign, Mail, Phone, UserRound } from "lucide-react";
import { LeadConversionDialog } from "@/components/leads/lead-conversion-dialog";
import { LeadDeleteDialog } from "@/components/leads/lead-delete-dialog";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { LeadStatusControl, type LeadStatusValue } from "@/components/leads/lead-status-control";
import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { currencyValues, leadSourceLabels, leadSourceValues } from "@/lib/leads/options";

const statusTone: Record<LeadStatusValue, string> = {
  NEW: "border-white/10 bg-white/[0.04] text-white/70",
  CONTACTED: "border-[#3b82f6]/25 bg-[#3b82f6]/10 text-[#93c5fd]",
  QUALIFIED: "border-[#8b5cf6]/25 bg-[#8b5cf6]/10 text-[#c4b5fd]",
  PROPOSAL_SENT: "border-[#3b82f6]/25 bg-[#3b82f6]/10 text-[#93c5fd]",
  WON: "border-[#22c55e]/20 bg-[#22c55e]/10 text-[#86efac]",
  LOST: "border-[#ef4444]/20 bg-[#ef4444]/10 text-[#fca5a5]",
};

function readable(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function LeadDetailPage({ params }: PageProps<"/leads/[leadId]">) {
  const { leadId } = await params;
  const { organization } = await requireOrganization();
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, organizationId: organization.id },
    include: {
      client: { select: { id: true, name: true } },
      activities: {
        where: { organizationId: organization.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { actor: { select: { name: true } } },
      },
      _count: { select: { activities: { where: { organizationId: organization.id } } } },
    },
  });

  if (!lead) notFound();

  const draft = {
    id: lead.id,
    name: lead.name,
    email: lead.email ?? "",
    phone: lead.phone ?? undefined,
    company: lead.company ?? undefined,
    source: leadSourceValues.includes(lead.source as (typeof leadSourceValues)[number]) ? lead.source as (typeof leadSourceValues)[number] : "OTHER",
    notes: lead.notes ?? undefined,
    status: lead.status,
    estimatedValue: lead.estimatedValue ? Number(lead.estimatedValue.toString()) : undefined,
    currency: currencyValues.includes(lead.currency as (typeof currencyValues)[number]) ? lead.currency as (typeof currencyValues)[number] : "USD",
    updatedAt: lead.updatedAt.toISOString(),
  };
  const converted = Boolean(lead.client || lead.convertedAt);

  return (
    <div className="space-y-6 pb-10">
      <div className="pt-2 sm:pt-5">
        <Link href="/leads" className="inline-flex h-8 items-center gap-1.5 rounded-md pr-2 text-xs font-medium text-white/50 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]">
          <ArrowLeft size={14} /> Leads
        </Link>
        <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a49bff]">Lead details</p>
              <span className={`inline-flex h-5 items-center rounded-full border px-2 text-[10px] font-medium ${statusTone[lead.status]}`}>{readable(lead.status)}</span>
            </div>
            <h1 className="mt-2 truncate text-[30px] font-semibold tracking-[-0.04em] text-[#f4f4f5] sm:text-[32px]">{lead.name}</h1>
            <p className="mt-1.5 text-sm text-white/50">{lead.company || "Individual lead"} <span className="mx-1.5 text-white/20">·</span> Added {lead.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(lead.status === "QUALIFIED" || lead.status === "WON") && !converted && <LeadConversionDialog leadId={lead.id} name={lead.name} company={lead.company} email={lead.email} phone={lead.phone} estimatedValue={lead.estimatedValue?.toString() ?? null} currency={lead.currency} />}
            {lead.client && <Link href={`/clients/${lead.client.id}`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#22c55e]/20 bg-[#22c55e]/[0.08] px-3 text-sm font-medium text-[#86efac] hover:bg-[#22c55e]/[0.13]">Converted to Client <span aria-hidden="true">→</span></Link>}
            {!converted && <LeadFormDialog lead={draft} />}
            <LeadStatusControl key={`${lead.id}-${lead.status}`} leadId={lead.id} initialStatus={lead.status} readOnly={converted} />
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
        <section className="space-y-5">
          <div className="rounded-[10px] border border-white/10 bg-[#18181b] p-4 sm:p-5">
            <h2 className="text-[15px] font-semibold text-[#f4f4f5]">Contact information</h2>
            <div className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <ContactItem icon={UserRound} label="Name" value={lead.name} />
              <ContactItem icon={Building2} label="Company" value={lead.company} />
              <ContactItem icon={Mail} label="Email" value={lead.email} href={lead.email ? `mailto:${lead.email}` : undefined} />
              <ContactItem icon={Phone} label="Phone" value={lead.phone} href={lead.phone ? `tel:${lead.phone}` : undefined} />
              <ContactItem icon={CalendarDays} label="Lead source" value={lead.source ? leadSourceLabels[lead.source as keyof typeof leadSourceLabels] ?? lead.source : null} />
              <ContactItem icon={CircleDollarSign} label="Estimated value" value={lead.estimatedValue !== null ? new Intl.NumberFormat("en-US", { style: "currency", currency: lead.currency, maximumFractionDigits: 2 }).format(Number(lead.estimatedValue.toString())) : null} />
              <ContactItem icon={CalendarDays} label="Updated" value={lead.updatedAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} />
              {lead.convertedAt && <ContactItem icon={CalendarDays} label="Converted" value={lead.convertedAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} />}
            </div>
          </div>

          <div className="rounded-[10px] border border-white/10 bg-[#18181b] p-4 sm:p-5">
            <h2 className="text-[15px] font-semibold text-[#f4f4f5]">Notes</h2>
            {lead.notes ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/65">{lead.notes}</p> : <p className="mt-3 text-sm text-white/40">No notes added yet.</p>}
          </div>
        </section>

        <aside className="rounded-[10px] border border-white/10 bg-[#18181b] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-[#f4f4f5]">Activity</h2>
              <p className="mt-1 text-xs text-white/45">Changes made to this lead.</p>
            </div>
            <span className="rounded-md border border-white/10 bg-white/[0.035] px-2 py-1 text-[11px] text-white/50">{lead._count.activities}</span>
          </div>
          {lead.activities.length ? (
            <ol className="mt-5 space-y-0">
              {lead.activities.map((activity, index) => (
                <li key={activity.id} className="relative flex gap-3 pb-5 last:pb-0">
                  {index < lead.activities.length - 1 && <span className="absolute left-[5px] top-3 h-full w-px bg-white/10" />}
                  <span className="relative mt-1 size-3 shrink-0 rounded-full border-2 border-[#a49bff]/50 bg-[#18181b]" />
                  <div className="min-w-0">
                    <p className="text-[13px] leading-5 text-white/75">{activity.description}</p>
                    <p className="mt-1 text-[11px] text-white/40">{activity.actor.name} <span className="mx-1 text-white/20">·</span> {activity.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : <p className="mt-5 text-sm text-white/40">No activity yet.</p>}
          {lead._count.activities > lead.activities.length && <p className="mt-4 border-t border-white/[0.07] pt-3 text-[11px] text-white/40">Showing the 20 most recent events.</p>}
        </aside>
      </div>

      <section className="flex flex-col gap-4 rounded-[10px] border border-[#ef4444]/15 bg-[#18181b] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5" aria-labelledby="lead-danger-heading">
        <div>
          <h2 id="lead-danger-heading" className="text-sm font-semibold text-[#f4f4f5]">Destructive action</h2>
          <p className="mt-1 max-w-xl text-xs leading-5 text-white/45">
            {converted ? "Converted leads are retained to protect their client relationship and sales history." : "Permanently remove this lead from the workspace."}
          </p>
        </div>
        {converted
          ? lead.client
            ? <Link href={`/clients/${lead.client.id}`} className="inline-flex h-9 items-center rounded-lg border border-[#22c55e]/20 bg-[#22c55e]/[0.08] px-3 text-xs font-medium text-[#86efac] hover:bg-[#22c55e]/[0.13]">View Client</Link>
            : <span className="text-xs font-medium text-white/40">Deletion unavailable</span>
          : <LeadDeleteDialog leadId={lead.id} name={lead.name} company={lead.company} email={lead.email} updatedAt={lead.updatedAt.toISOString()} />}
      </section>
    </div>
  );
}

function ContactItem({ icon: Icon, label, value, href }: { icon: typeof UserRound; label: string; value: string | null; href?: string }) {
  return (
    <div className="flex min-w-0 gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.03] text-white/50"><Icon size={15} /></span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-white/40">{label}</p>
        {href && value ? <a href={href} className="mt-1 block truncate text-sm text-white/80 hover:text-[#c4b5fd]">{value}</a> : <p className="mt-1 truncate text-sm text-white/80">{value || "Not provided"}</p>}
      </div>
    </div>
  );
}