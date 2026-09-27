import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, LayoutDashboard, LogOut, Settings2, Sparkles, Users } from "lucide-react";
import { signOut } from "@/app/actions/auth";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: ArrowUpRight },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/projects", label: "Projects", icon: BriefcaseBusiness },
  { href: "/assistant", label: "Assistant", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

type WorkspaceShellProps = {
  children: React.ReactNode;
  organizationName: string;
  userName: string;
};

export function WorkspaceShell({ children, organizationName, userName }: WorkspaceShellProps) {
  return (
    <div className="min-h-screen bg-[#0d0c10] text-[#f4f3f6]">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-white/10 bg-[#0a090d] px-4 py-6 lg:flex">
        <Link href="/dashboard" className="mb-9 flex items-center gap-3 px-1 text-lg font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-lg bg-[#695be7] text-white"><Sparkles size={18} /></span>
          <span>BusinessFlow AI</span>
        </Link>
        <div className="mb-7 rounded-lg border border-white/10 bg-white/[0.04] p-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">Workspace</p>
          <p className="mt-1 truncate text-sm font-medium">{organizationName}</p>
        </div>
        <nav className="space-y-1" aria-label="Workspace navigation">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-white/65 transition hover:bg-white/[0.07] hover:text-white">
              <Icon size={17} strokeWidth={1.7} />{label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/10 pt-4">
          <p className="truncate px-3 text-sm font-medium">{userName}</p>
          <p className="px-3 pt-1 text-xs text-white/45">Workspace member</p>
          <form action={signOut} className="mt-3">
            <button type="submit" className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-white/60 transition hover:bg-white/[0.07] hover:text-white">
              <LogOut size={16} />Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="border-b border-white/10 px-5 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm text-white/50 lg:hidden">{organizationName}</p>
              <p className="hidden text-sm text-white/50 lg:block">{organizationName} <span className="px-2 text-white/25">/</span> BusinessFlow AI</p>
            </div>
            <form action={signOut} className="lg:hidden">
              <button type="submit" className="flex h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-white/75">
                <LogOut size={16} /> Sign out
              </button>
            </form>
            <p className="hidden text-sm text-white/70 lg:block">{userName}</p>
          </div>
          <nav className="mt-4 flex gap-1 overflow-x-auto lg:hidden" aria-label="Workspace navigation">
            {navigation.map(({ href, label }) => (
              <Link key={href} href={href} className="shrink-0 rounded-md px-3 py-2 text-xs text-white/65 hover:bg-white/[0.07] hover:text-white">{label}</Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}