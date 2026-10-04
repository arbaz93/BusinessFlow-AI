"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCheck, FileText, LayoutDashboard, Sparkles } from "lucide-react";

const tabs = [
  { suffix: "", label: "Overview", icon: LayoutDashboard },
  { suffix: "/tasks", label: "Tasks", icon: CheckCheck },
  { suffix: "/documents", label: "Documents", icon: FileText },
  { suffix: "/ai", label: "AI Intelligence", icon: Sparkles },
] as const;

export function ProjectWorkspaceTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const baseHref = `/projects/${projectId}`;

  return (
    <nav aria-label="Project workspace tabs" className="border-b border-white/10">
      <div className="-mb-px flex gap-1 overflow-x-auto">
        {tabs.map(({ suffix, label, icon: Icon }) => {
          const href = `${baseHref}${suffix}`;
          const active = suffix ? pathname === href || pathname.startsWith(`${href}/`) : pathname === href;

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#a49bff] ${
                active
                  ? "border-[#a49bff] text-white"
                  : "border-transparent text-white/50 hover:border-white/20 hover:text-white/80"
              }`}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
