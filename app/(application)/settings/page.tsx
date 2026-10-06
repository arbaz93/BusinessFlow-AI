import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Building2, DeleteIcon, Lock, User } from "lucide-react";

type SettingCard = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  danger?: boolean;
};

const cards: SettingCard[] = [
  {
    href: "/settings/workspace",
    label: "Workspace",
    description: "Name, business type, and workspace identity.",
    icon: Building2,
  },
  {
    href: "/settings/profile",
    label: "Profile",
    description: "Your name, email, and avatar.",
    icon: User,
  },
  {
    href: "/settings/security",
    label: "Security",
    description: "Password and authentication controls.",
    icon: Lock,
  },
  {
    href: "/settings/delete-account",
    label: "Delete Account",
    description: "Permanently delete your account and workspace.",
    icon: DeleteIcon,
    danger: true,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-1">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
        Settings
      </h2>
      <p className="text-sm text-[var(--muted)]">
        Manage your profile, workspace, security, and account settings.
      </p>

      <div className="grid gap-3 pt-2 sm:grid-cols-2">
        {cards.map(({ href, label, description, icon: Icon, danger }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-start gap-3.5 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 text-left transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]"
          >
            <span
              className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg"
              style={{
                backgroundColor: danger ? "rgba(239,68,68,0.12)" : "rgba(139,92,246,0.12)",
              }}
            >
              <Icon
                size={17}
                className={danger ? "text-[#fca5a5]" : "text-[var(--accent-muted)]"}
              />
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={
                  "block text-sm font-medium " +
                  (danger ? "text-[#fca5a5]" : "group-hover:text-[var(--foreground)] text-[var(--foreground)]")
                }
              >
                {label}
              </span>
              <span className="mt-0.5 block text-sm text-[var(--muted)]">{description}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
