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
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
        Settings
      </h2>
      <p className="text-sm text-[#a1a1aa]">
        Manage your profile, workspace, security, and account settings.
      </p>

      <div className="grid gap-3 pt-2 sm:grid-cols-2">
        {cards.map(({ href, label, description, icon: Icon, danger }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-start gap-3.5 rounded-xl border border-[#27272a] bg-[#18181b] p-4 text-left transition-colors hover:border-[#3f3f46] hover:bg-[#1f1f23] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]"
          >
            <span
              className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg"
              style={{
                backgroundColor: danger ? "rgba(239,68,68,0.12)" : "rgba(139,92,246,0.12)",
              }}
            >
              <Icon
                size={17}
                className={danger ? "text-[#fca5a5]" : "text-[#c4b5fd]"}
              />
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={
                  "block text-sm font-medium " +
                  (danger ? "text-[#fca5a5]" : "group-hover:text-white text-[#f4f4f5]")
                }
              >
                {label}
              </span>
              <span className="mt-0.5 block text-sm text-[#a1a1aa]">{description}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
