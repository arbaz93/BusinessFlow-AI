"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CheckCheck,
  FolderKanban,
  LayoutDashboard,
  Settings2,
  Sparkles,
  Users,
} from "lucide-react";

const navigationGroups = [
  {
    label: "Workspace",
    items: [{ href: "/dashboard", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "Sales",
    items: [
      { href: "/leads", label: "Leads", icon: Users },
      { href: "/clients", label: "Clients", icon: Building2 },
    ],
  },
  {
    label: "Delivery",
    items: [
      { href: "/projects", label: "Projects", icon: FolderKanban },
      { href: "/tasks", label: "Tasks", icon: CheckCheck },
    ],
  },
  {
    label: "Intelligence",
    items: [{ href: "/assistant", label: "AI Assistant", icon: Sparkles }],
  },
  {
    label: "Account",
    items: [{ href: "/settings", label: "Settings", icon: Settings2 }],
  },
];

export function getNavigationContext(pathname: string) {
  for (const group of navigationGroups) {
    const item = group.items.find(
      ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
    );

    if (item) return { section: group.label, label: item.label };
  }

  return { section: "Workspace", label: "Overview" };
}

export function WorkspaceNavigation({
  compact = false,
  onNavigate,
}: {
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="space-y-5" aria-label="Workspace navigation">
      {navigationGroups.map(({ label: groupLabel, items }) => (
        <section key={groupLabel} aria-label={groupLabel}>
          <h2
            className={`mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40 ${
              compact ? "sr-only" : ""
            }`}
          >
            {groupLabel}
          </h2>
          <div className="space-y-1">
            {items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  aria-label={compact ? label : undefined}
                  title={compact ? label : undefined}
                  className={`flex h-10 items-center rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b83f5] ${
                    compact ? "justify-center px-0" : "gap-3 px-3"
                  } ${
                    active
                      ? "bg-[#1f1f23] text-white before:-mr-px before:h-5 before:w-0.5 before:rounded-full before:bg-[#a49bff]"
                      : "text-white/65 hover:bg-white/6 hover:text-white"
                  }`}
                >
                  <Icon
                    size={17}
                    strokeWidth={1.8}
                    className={active ? "text-[#a49bff]" : "text-white/55"}
                  />
                  {!compact && label}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}