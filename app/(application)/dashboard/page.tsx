import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CircleAlert, ClipboardList, Users } from "lucide-react";
import { requireOrganization } from "@/lib/auth/dal";

const metrics = [
  { label: "Overdue tasks", value: "--", note: "Tasks will appear here", icon: CircleAlert, tone: "border-rose-400/25 bg-rose-950/35" },
  { label: "Attention required", value: "--", note: "No workflow data yet", icon: CircleAlert, tone: "border-amber-300/25 bg-amber-950/30" },
  { label: "Active projects", value: "0", note: "Ready when you are", icon: BriefcaseBusiness, tone: "border-white/10 bg-white/[0.035]" },
  { label: "Upcoming tasks", value: "0", note: "Due dates will appear here", icon: ClipboardList, tone: "border-white/10 bg-white/[0.035]" },
];

const startingPoints = [
  { href: "/leads", label: "Leads", description: "Keep new opportunities moving.", icon: ArrowRight },
  { href: "/clients", label: "Clients", description: "Build a clear client record.", icon: Users },
  { href: "/projects", label: "Projects", description: "Bring delivery into one view.", icon: BriefcaseBusiness },
];

export default async function DashboardPage() {
  const { profile } = await requireOrganization();
  const firstName = profile.name.trim().split(/\s+/)[0] || "there";

  return (
    <div>
      <section className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-medium text-[#a49bff]">Workspace overview</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back, {firstName}</h1>
          <p className="mt-2 text-sm text-white/55">Here’s a clear view of what’s moving in your workspace.</p>
        </div>
        <Link href="/projects" className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#695be7] px-4 text-sm font-semibold text-white transition hover:bg-[#776bee]">
          <BriefcaseBusiness size={16} /> View projects
        </Link>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Workspace metrics">
        {metrics.map(({ label, value, note, icon: Icon, tone }) => (
          <article key={label} className={`flex min-h-32 flex-col justify-between rounded-xl border p-4 ${tone}`}>
            <div className="flex items-center justify-between gap-3 text-sm text-white/65">
              <h2>{label}</h2><Icon size={17} strokeWidth={1.6} />
            </div>
            <div className="mt-5 flex items-end justify-between gap-3">
              <p className="text-3xl font-semibold leading-none">{value}</p>
              <p className="text-xs text-white/40">{note}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#a49bff]">Your operations</p>
            <h2 className="mt-2 text-xl font-semibold">A connected view of client work</h2>
          </div>
          <p className="text-sm text-white/45">Your workspace is ready to grow.</p>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {startingPoints.map(({ href, label, description, icon: Icon }) => (
            <Link key={href} href={href} className="group rounded-lg border border-white/10 bg-[#121116] p-4 transition hover:border-[#695be7]/70">
              <div className="flex items-center justify-between text-white/70"><Icon size={18} /><ArrowRight className="transition group-hover:translate-x-1" size={16} /></div>
              <h3 className="mt-5 font-medium">{label}</h3>
              <p className="mt-1 text-sm text-white/45">{description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}