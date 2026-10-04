"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Building2, Lock, Trash2, User } from "lucide-react";
import { cn } from "@/lib/utils";

type SettingsNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  danger?: boolean;
};

type SettingsNavGroup = {
  label: string;
  items: SettingsNavItem[];
};

const navigationGroups: SettingsNavGroup[] = [
  {
    label: "General",
    items: [
      { href: "/settings/workspace", label: "Workspace", icon: Building2 },
      { href: "/settings/profile", label: "Profile", icon: User },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/settings/security", label: "Security", icon: Lock },
      {
        href: "/settings/delete-account",
        label: "Delete Account",
        icon: Trash2,
        danger: true,
      },
    ],
  },
];

export function SettingsSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="space-y-6" aria-label="Settings">
      {navigationGroups.map(({ label: groupLabel, items }) => (
        <section key={groupLabel} aria-label={groupLabel}>
          <h2 className="px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
            {groupLabel}
          </h2>
          <div className="mt-2 space-y-1">
            {items.map(({ href, label, icon: Icon, danger }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]",
                    active
                      ? "bg-[#1f1f23] text-white before:-mr-px before:h-5 before:w-0.5 before:rounded-full before:bg-[#a49bff]"
                      : danger
                        ? "text-[#fca5a5] hover:bg-[#ef4444]/10"
                        : "text-white/65 hover:bg-white/6 hover:text-white",
                  )}
                >
                  <Icon
                    size={17}
                    strokeWidth={1.8}
                    className={cn(
                      "shrink-0",
                      active ? "text-[#a49bff]" : danger ? "text-[#fca5a5]" : "text-white/55",
                    )}
                  />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}
