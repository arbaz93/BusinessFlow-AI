import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, CalendarDays, FileText, FolderKanban, Mail, Phone, UserRound } from "lucide-react";
import { ClientActionsMenu } from "@/components/clients/client-actions-menu";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { projectPriorityLabels, projectStatusLabels, projectStatusTone } from "@/lib/projects/options";
import { isActiveProjectStatus } from "@/lib/projects/timeline";
import { activeTaskStatuses } from "@/lib/tasks/options";

export default async function ClientDetailPage({ params }: PageProps<"/clients/[clientId]">) {
  const { clientId } = await params;
  const { organization } = await requireOrganization();
  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId: organization.id },
    include: {
      lead: { select: { id: true, name: true, company: true } },
      activities: {
        where: { organizationId: organization.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { actor: { select: { name: true } } },
      },
      projects: {
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
          priority: true,
          dueDate: true,
          updatedAt: true,
          _count: {
            select: {
              tasks: {
                where: { organizationId: organization.id, status: { in: activeTaskStatuses } },
              },
            },
          },
        },
      },
      _count: { select: { activities: { where: { organizationId: organization.id } } } },
    },
  });

  if (!client) notFound();
  const latestActivity = client.activities[0];
  const activeProjects = client.projects.filter((project) => isActiveProjectStatus(project.status)).length;
  const completedProjects = client.projects.filter((project) => project.status === "COMPLETED").length;
  const clients = await prisma.client.findMany({
    where: { organizationId: organization.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, company: true },
  });
  const draft = {
    id: client.id,
    name: client.name,
    company: client.company ?? undefined,
    email: client.email ?? "",
    phone: client.phone ?? undefined,
    status: client.status,
    notes: client.notes ?? undefined,
    updatedAt: client.updatedAt.toISOString(),
  };

  return (
    <div className="space-y-7 pb-10">
      <div className="pt-2 sm:pt-5">
        <Link href="/clients" className="inline-flex h-8 items-center gap-1.5 rounded-md pr-2 text-xs font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]">
          <ArrowLeft size={14} /> Clients
        </Link>
        <div className="mt-4 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--info-line)]">Client workspace</p>
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              <h1 className="truncate text-[30px] font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-[32px]">{client.name}</h1>
              <span className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-medium ${client.status === "ACTIVE" ? "border-[var(--success-border)]/20 bg-[var(--success-surface)] text-[var(--success-line)]" : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"}`}>{client.status === "ACTIVE" ? "Active" : "Inactive"}</span>
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">{client.company || "Independent client"} <span className="mx-1.5 text-[var(--foreground)]/20">·</span> Client since {client.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--muted)]">
              {client.email && <a href={`mailto:${client.email}`} className="inline-flex min-h-8 items-center gap-1.5 hover:text-[var(--foreground)]"><Mail size={14} />{client.email}</a>}
              {client.phone && <a href={`tel:${client.phone}`} className="inline-flex min-h-8 items-center gap-1.5 hover:text-[var(--foreground)]"><Phone size={14} />{client.phone}</a>}
              {client.lead && <Link href={`/leads/${client.lead.id}`} className="inline-flex min-h-8 items-center gap-1.5 text-[var(--accent-muted)] hover:text-[var(--foreground)]">Converted from Lead <span aria-hidden="true">→</span></Link>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ClientFormDialog client={draft} />
            <ProjectFormDialog clients={clients} defaultClientId={client.id} triggerLabel="Create Project" />
            <ClientActionsMenu
              clientId={client.id}
              name={client.name}
              company={client.company}
              email={client.email}
              status={client.status}
            />
          </div>
        </div>
      </div>

      <section aria-label="Client overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric icon={FolderKanban} label="Active Projects" value={String(activeProjects)} note="Planning, in progress, or on hold" />
        <SummaryMetric icon={BriefcaseBusiness} label="Total Projects" value={String(client.projects.length)} note="Across this client" />
        <SummaryMetric icon={CalendarDays} label="Completed" value={String(completedProjects)} note="Delivered work" />
        <SummaryMetric icon={CalendarDays} label="Last Activity" value={latestActivity ? latestActivity.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "None"} note={latestActivity ? latestActivity.description : "No recorded activity"} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
        <div className="space-y-6">
          <section className="rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5" aria-labelledby="projects-heading">
            <div className="flex items-center justify-between gap-4">
              <div><h2 id="projects-heading" className="text-[16px] font-semibold text-[var(--foreground)]">Projects</h2><p className="mt-1 text-xs text-[var(--muted)]">Delivery work associated with this client.</p></div>
              <ProjectFormDialog clients={clients} defaultClientId={client.id} triggerLabel="New Project" />
            </div>
            {client.projects.length ? (
              <div className="mt-4 space-y-3">
                {client.projects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`} className="block rounded-lg border border-[var(--line)] bg-[var(--surface)]/80 p-3 transition-colors hover:border-[#8b5cf6]/30 hover:bg-[var(--surface)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--foreground)]">{project.name}</p>
                        <p className="mt-1 text-[11px] text-[var(--muted)]">Priority: {projectPriorityLabels[project.priority]}</p>
                      </div>
                      <span className={`inline-flex h-6 shrink-0 items-center rounded-full border px-2 text-[10px] font-medium ${projectStatusTone[project.status]}`}>{projectStatusLabels[project.status]}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--muted)]">
                      <span>Due {project.dueDate ? new Date(project.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No date"}</span>
                      <span>Updated {new Date(project.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      <span>{project._count.tasks} open {project._count.tasks === 1 ? "task" : "tasks"}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface)]/60 px-4 py-8 text-center">
                <span className="mx-auto grid size-9 place-items-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"><FolderKanban size={16} /></span>
                <h3 className="mt-3 text-sm font-medium text-[var(--foreground)]">No projects yet</h3>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[var(--muted)]">Create a project to start organizing work for this client.</p>
                <div className="mt-4 flex justify-center">
                  <ProjectFormDialog clients={clients} defaultClientId={client.id} triggerLabel="Create Project" />
                </div>
              </div>
            )}
          </section>

          <section className="rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5" aria-labelledby="client-info-heading">
            <div><h2 id="client-info-heading" className="text-[16px] font-semibold text-[var(--foreground)]">Client information</h2><p className="mt-1 text-xs text-[var(--muted)]">Contact details and ongoing relationship context.</p></div>
            <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <ContactItem icon={UserRound} label="Name" value={client.name} />
              <ContactItem icon={BriefcaseBusiness} label="Company" value={client.company} />
              <ContactItem icon={Mail} label="Email" value={client.email} href={client.email ? `mailto:${client.email}` : undefined} />
              <ContactItem icon={Phone} label="Phone" value={client.phone} href={client.phone ? `tel:${client.phone}` : undefined} />
              <ContactItem icon={CalendarDays} label="Client since" value={client.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} />
              <ContactItem icon={BriefcaseBusiness} label="Status" value={client.status === "ACTIVE" ? "Active" : "Inactive"} />
            </div>
            <div className="mt-5 border-t border-[var(--line)] pt-4">
              <h3 className="text-xs font-medium text-[var(--muted)]">Notes</h3>
              {client.notes ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">{client.notes}</p> : <p className="mt-2 text-sm text-[var(--muted)]">No client notes yet. Use Edit Client to add ongoing context.</p>}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5" aria-labelledby="client-activity-heading">
            <div className="flex items-center justify-between gap-3"><div><h2 id="client-activity-heading" className="text-[16px] font-semibold text-[var(--foreground)]">Activity</h2><p className="mt-1 text-xs text-[var(--muted)]">Recent client relationship history.</p></div><span className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-[11px] text-[var(--muted)]">{client._count.activities}</span></div>
            {client.activities.length ? (
              <ol className="mt-5 space-y-0">
                {client.activities.map((activity, index) => (
                  <li key={activity.id} className="relative flex gap-3 pb-5 last:pb-0">
                    {index < client.activities.length - 1 && <span className="absolute left-[5px] top-3 h-full w-px bg-[var(--surface)]" />}
                    <span className="relative mt-1 size-3 shrink-0 rounded-full border-2 border-[#93c5fd]/50 bg-[var(--panel)]" />
                    <div className="min-w-0"><p className="text-[13px] leading-5 text-[var(--foreground)]">{activity.description}</p><p className="mt-1 text-[11px] text-[var(--muted)]">{activity.actor.name} <span className="mx-1 text-[var(--foreground)]/20">·</span> {activity.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p></div>
                  </li>
                ))}
              </ol>
            ) : <p className="mt-5 text-sm text-[var(--muted)]">No activity has been recorded yet.</p>}
            {client._count.activities > client.activities.length && <p className="mt-4 border-t border-[var(--line)] pt-3 text-[11px] text-[var(--muted)]">Showing the 20 most recent events.</p>}
          </section>

          <section className="rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5" aria-labelledby="documents-heading">
            <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-md border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"><FileText size={15} /></span><div><h2 id="documents-heading" className="text-[15px] font-semibold text-[var(--foreground)]">Documents</h2><p className="mt-0.5 text-xs text-[var(--muted)]">Client files and shared materials.</p></div></div>
            <p className="mt-4 text-sm text-[var(--muted)]">Document storage is not available yet.</p>
          </section>

          {client.lead && (
            <section className="rounded-[10px] border border-[#8b5cf6]/15 bg-[var(--panel)] p-4 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-muted)]">Converted from Lead</p>
              <Link href={`/leads/${client.lead.id}`} className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent-muted)]">{client.lead.name}{client.lead.company ? ` · ${client.lead.company}` : ""}<span aria-hidden="true">→</span></Link>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function SummaryMetric({ icon: Icon, label, value, note }: { icon: typeof CalendarDays; label: string; value: string; note: string }) {
  return <div className="min-w-0 rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-3.5"><div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-[var(--muted)]">{label}</p><Icon size={14} className="shrink-0 text-[var(--muted)]" /></div><p className="mt-2 truncate text-xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{value}</p><p className="mt-1 truncate text-[11px] text-[var(--muted)]">{note}</p></div>;
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