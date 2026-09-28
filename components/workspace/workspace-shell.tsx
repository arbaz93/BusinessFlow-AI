"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Dialog, DropdownMenu } from "radix-ui";
import {
  Building2,
  ChevronDown,
  ChevronLeft,
  LogOut,
  Menu,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import {
  getNavigationContext,
  WorkspaceNavigation,
} from "@/components/workspace/workspace-navigation";

type WorkspaceShellProps = {
  children: React.ReactNode;
  organizationName: string;
  userName: string;
  userEmail: string;
  avatarUrl: string | null;
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";
}

function AccountMenu({
  compact,
  userName,
  userEmail,
  avatarUrl,
  onNavigate,
}: {
  compact: boolean;
  userName: string;
  userEmail: string;
  avatarUrl: string | null;
  onNavigate?: () => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={`${userName} account menu`}
          className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b83f5] ${
            compact ? "justify-center" : ""
          }`}
        >
          <Avatar.Root className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#29272e] text-xs font-semibold text-white/85">
            <Avatar.Image src={avatarUrl ?? undefined} alt="" className="size-full object-cover" />
            <Avatar.Fallback>{getInitials(userName)}</Avatar.Fallback>
          </Avatar.Root>
          {!compact && (
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-white/90">{userName}</span>
              <span className="truncate text-xs text-white/45">{userEmail}</span>
            </span>
          )}
          {!compact && <ChevronDown size={15} className="shrink-0 text-white/40" />}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side={compact ? "right" : "top"}
          align="start"
          sideOffset={8}
          className="z-70 min-w-52 rounded-lg border border-white/10 bg-[#18181b] p-1.5 text-sm text-white shadow-xl outline-none"
        >
          <DropdownMenu.Label className="px-2 py-1.5">
            <span className="block truncate font-medium">{userName}</span>
            <span className="block truncate text-xs text-white/45">{userEmail}</span>
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="my-1 h-px bg-white/10" />
          <DropdownMenu.Item asChild onSelect={onNavigate}>
            <Link
              href="/settings"
              className="flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-white/75 outline-none transition-colors hover:bg-white/[0.07] focus:bg-white/[0.07]"
            >
              <Settings2 size={16} />
              Settings
            </Link>
          </DropdownMenu.Item>
          <form action={signOut}>
            <DropdownMenu.Item asChild onSelect={(event) => event.preventDefault()}>
              <button
                type="submit"
                className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-left text-white/75 outline-none transition-colors hover:bg-white/[0.07] focus:bg-white/[0.07]"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </DropdownMenu.Item>
          </form>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function SidebarContents({
  organizationName,
  userName,
  userEmail,
  avatarUrl,
  compact = false,
  onNavigate,
  onClose,
}: {
  organizationName: string;
  userName: string;
  userEmail: string;
  avatarUrl: string | null;
  compact?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  return (
    <aside className="flex h-full min-h-0 flex-col bg-[#111113] px-3 py-5 text-[#f4f4f5]">
      <div className={`mb-6 flex h-9 shrink-0 items-center ${compact ? "justify-center" : "justify-between"}`}>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          aria-label="BusinessFlow AI overview"
          className={`flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b83f5] ${
            compact ? "justify-center" : ""
          }`}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#7067e8] text-white">
            <Sparkles size={17} />
          </span>
          {!compact && <span className="truncate text-base font-semibold">BusinessFlow AI</span>}
        </Link>

        {onClose && (
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close navigation"
              className="grid size-10 shrink-0 place-items-center rounded-lg text-white/60 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b83f5]"
            >
              <X size={18} />
            </button>
          </Dialog.Close>
        )}
      </div>

      <div
        role="group"
        aria-label={`Current workspace: ${organizationName}`}
        title={compact ? organizationName : undefined}
        className={`flex h-11 shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-2 ${
          compact ? "justify-center" : ""
        }`}
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[#25242b] text-white/70">
          <Building2 size={16} />
        </span>
        {!compact && (
          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-white/40">
              Workspace
            </span>
            <span className="block truncate text-[13px] font-medium text-white/85">
              {organizationName}
            </span>
          </span>
        )}
      </div>

      <div className="mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <WorkspaceNavigation compact={compact} onNavigate={onNavigate} />
      </div>

      <footer className="mt-4 shrink-0 border-t border-white/10 pt-3">
        <AccountMenu
          compact={compact}
          userName={userName}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
          onNavigate={onNavigate}
        />
      </footer>
    </aside>
  );
}

export function WorkspaceShell({
  children,
  organizationName,
  userName,
  userEmail,
  avatarUrl,
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const { section, label } = getNavigationContext(pathname);
  const [tabletExpanded, setTabletExpanded] = useState(false);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  return (
    <Dialog.Root
      open={mobileNavigationOpen}
      onOpenChange={setMobileNavigationOpen}
    >
      <div className="min-h-screen bg-[#09090b] text-[#f4f4f5]">
        <div className="fixed inset-y-0 left-0 z-20 hidden w-62 xl:block">
          <SidebarContents
            organizationName={organizationName}
            userName={userName}
            userEmail={userEmail}
            avatarUrl={avatarUrl}
            onNavigate={() => setMobileNavigationOpen(false)}
          />
        </div>

        <div
          className={`fixed inset-y-0 left-0 z-20 hidden transition-[width] duration-200 motion-reduce:transition-none md:block xl:hidden ${
            tabletExpanded ? "w-62" : "w-18"
          }`}
        >
          <SidebarContents
            organizationName={organizationName}
            userName={userName}
            userEmail={userEmail}
            avatarUrl={avatarUrl}
            compact={!tabletExpanded}
          />
        </div>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/65 md:hidden" />
          <Dialog.Content
            className="fixed inset-y-0 left-0 z-50 h-dvh w-72 max-w-[calc(100vw-1.5rem)] overflow-y-auto outline-none md:hidden"
            style={{
              paddingTop: "max(1.25rem, env(safe-area-inset-top))",
              paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
            }}
          >
            <Dialog.Title className="sr-only">
              Application navigation
            </Dialog.Title>
            <SidebarContents
              organizationName={organizationName}
              userName={userName}
              userEmail={userEmail}
              avatarUrl={avatarUrl}
              onNavigate={() => setMobileNavigationOpen(false)}
              onClose={() => setMobileNavigationOpen(false)}
            />
          </Dialog.Content>
        </Dialog.Portal>

        <div
          className={`transition-[padding] duration-200 motion-reduce:transition-none ${
            tabletExpanded ? "md:pl-62" : "md:pl-18"
          } xl:pl-62`}
        >
          <header className="flex h-14 items-center border-b border-white/10 px-3 sm:px-5 xl:px-7">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <Dialog.Trigger asChild>
                <button
                  type="button"
                  aria-label="Open navigation"
                  className="grid size-10 shrink-0 place-items-center rounded-lg text-white/65 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b83f5] md:hidden"
                >
                  <Menu size={19} />
                </button>
              </Dialog.Trigger>
              <button
                type="button"
                aria-label={
                  tabletExpanded ? "Collapse sidebar" : "Expand sidebar"
                }
                aria-expanded={tabletExpanded}
                onClick={() => setTabletExpanded((expanded) => !expanded)}
                className="hidden size-10 shrink-0 place-items-center rounded-lg text-white/65 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b83f5] md:grid xl:hidden"
              >
                {tabletExpanded ? (
                  <ChevronLeft size={18} />
                ) : (
                  <Menu size={19} />
                )}
              </button>
              <div className="flex min-w-0 items-center gap-2 md:hidden">
                <span className="font-medium text-white/25">
                  BusinessFlow AI
                </span>
                <span className="px-2 text-white/25">/</span>
                <span className="font-medium text-white">{label}</span>
              </div>
              <p className="hidden min-w-0 truncate text-sm text-white/50 md:block">
                <span>{section}</span>
                <span className="px-2 text-white/25">/</span>
                <span className="font-medium text-white">{label}</span>
              </p>
            </div>
          </header>
          <main className="mx-auto w-full max-w-375 px-4 py-6 sm:px-6 sm:py-8 xl:px-10">
            {children}
          </main>
        </div>
      </div>
    </Dialog.Root>
  );
}