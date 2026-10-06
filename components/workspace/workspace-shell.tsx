"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Dialog, DropdownMenu } from "radix-ui";

import { ThemeToggle } from "@/components/theme-toggle";
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
import { OrganizationRole } from "@/app/generated/prisma/enums";
import { signOut } from "@/app/actions/auth";
import { switchWorkspaceAction } from "@/app/actions/members";
import {
  getNavigationContext,
  WorkspaceNavigation,
} from "@/components/workspace/workspace-navigation";
import {
  DropdownMenu as WorkspaceDropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobalSearch } from "@/components/workspace/global-search";

type WorkspaceShellProps = {
  children: React.ReactNode;
  organizationName: string;
  organizationId: string;
  workspaces: { id: string; name: string; role: OrganizationRole }[];
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

function WorkspaceSwitcher({
  organizationName,
  organizationId,
  workspaces,
  compact,
  onNavigate,
}: {
  organizationName: string;
  organizationId: string;
  workspaces: { id: string; name: string; role: OrganizationRole }[];
  compact: boolean;
  onNavigate?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const organizationIdRef = useRef<HTMLInputElement>(null);

  function switchWorkspace(nextOrganizationId: string) {
    if (nextOrganizationId === organizationId) return;

    if (organizationIdRef.current) {
      organizationIdRef.current.value = nextOrganizationId;
    }
    onNavigate?.();
    formRef.current?.requestSubmit();
  }

  const roleLabel = (role: OrganizationRole) => (role === OrganizationRole.OWNER ? "Owner" : "Member");

  return (
    <form
      ref={formRef}
      action={switchWorkspaceAction}
      title={compact ? organizationName : undefined}
      className="shrink-0"
    >
      <input
        ref={organizationIdRef}
        type="hidden"
        name="organizationId"
        value={organizationId}
        readOnly
      />
      <WorkspaceDropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Switch workspace, current workspace: ${organizationName}`}
            disabled={workspaces.length < 2}
            className={`flex h-11 w-full items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#8b83f5] disabled:cursor-default ${
              compact ? "justify-center" : "hover:bg-[var(--elevated)]"
            }`}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[var(--surface)] text-[var(--muted)]">
              <Building2 size={16} />
            </span>
            {!compact && (
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="block text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                  Workspace
                </span>
                <span className="truncate text-[13px] font-medium text-[var(--foreground)]">
                  {organizationName}
                </span>
              </span>
            )}
            {workspaces.length > 1 && (
              <ChevronDown
                size={15}
                className={`shrink-0 text-[var(--muted-foreground)] ${compact ? "sr-only" : ""}`}
                aria-hidden="true"
              />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side={compact ? "right" : "bottom"}
          className="min-w-56"
        >
          <DropdownMenuLabel>Select Workspace</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={organizationId}
            onValueChange={switchWorkspace}
          >
            {workspaces.map((workspace) => (
              <DropdownMenuRadioItem key={workspace.id} value={workspace.id}>
                <span className="flex flex-col">
                  <span className="truncate">{workspace.name}</span>
                  {workspace.id === organizationId && (
                    <span className="text-[10px] text-[var(--foreground)]/40">
                      You · {roleLabel(workspace.role)}
                    </span>
                  )}
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </WorkspaceDropdownMenu>
    </form>
  );
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
          className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b83f5] ${
            compact ? "justify-center" : ""
          }`}
        >
          <Avatar.Root className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--elevated)] text-xs font-semibold text-[var(--foreground)]">
            <Avatar.Image src={avatarUrl ?? undefined} alt="" className="size-full object-cover" />
            <Avatar.Fallback>{getInitials(userName)}</Avatar.Fallback>
          </Avatar.Root>
          {!compact && (
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-[var(--foreground)]">{userName}</span>
              <span className="truncate text-xs text-[var(--muted)]">{userEmail}</span>
            </span>
          )}
          {!compact && <ChevronDown size={15} className="shrink-0 text-[var(--muted-foreground)]" />}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side={compact ? "right" : "top"}
          align="start"
          sideOffset={8}
          className="z-70 min-w-52 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-1.5 text-sm text-[var(--foreground)] shadow-xl outline-none"
        >
          <DropdownMenu.Label className="px-2 py-1.5">
            <span className="block truncate font-medium">{userName}</span>
            <span className="block truncate text-xs text-[var(--muted)]">{userEmail}</span>
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="my-1 h-px bg-[var(--line)]" />
          <DropdownMenu.Item asChild onSelect={onNavigate}>
            <Link
              href="/settings"
              className="flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-[var(--foreground)] outline-none transition-colors hover:bg-[var(--surface)] focus:bg-[var(--surface)]"
            >
              <Settings2 size={16} />
              Settings
            </Link>
          </DropdownMenu.Item>
          <form action={signOut}>
            <DropdownMenu.Item asChild onSelect={(event) => event.preventDefault()}>
              <button
                type="submit"
                className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-left text-[var(--foreground)] outline-none transition-colors hover:bg-[var(--surface)] focus:bg-[var(--surface)]"
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
  organizationId,
  workspaces,
  userName,
  userEmail,
  avatarUrl,
  compact = false,
  onNavigate,
  onClose,
}: {
  organizationName: string;
  organizationId: string;
  workspaces: { id: string; name: string; role: OrganizationRole }[];
  userName: string;
  userEmail: string;
  avatarUrl: string | null;
  compact?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  return (
    <aside className="flex h-full min-h-0 flex-col bg-[var(--surface)] px-3 py-5 text-[var(--foreground)]">
      <div className={`mb-6 flex h-9 shrink-0 items-center ${compact ? "justify-center" : "justify-between"}`}>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          aria-label="BusinessFlow AI overview"
          className={`flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b83f5] ${
            compact ? "justify-center" : ""
          }`}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--accent)] text-[var(--foreground)]">
            <Sparkles size={17} />
          </span>
          {!compact && <span className="truncate text-base font-semibold">BusinessFlow AI</span>}
        </Link>

        {onClose && (
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close navigation"
              className="grid size-10 shrink-0 place-items-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--panel)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b83f5]"
            >
              <X size={18} />
            </button>
          </Dialog.Close>
        )}
      </div>

      <WorkspaceSwitcher
        organizationName={organizationName}
        organizationId={organizationId}
        workspaces={workspaces}
        compact={compact}
        onNavigate={onNavigate}
      />

      <div className="mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <WorkspaceNavigation compact={compact} onNavigate={onNavigate} />
      </div>

      <footer className="mt-4 shrink-0 border-t border-[var(--line)] pt-3">
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
  organizationId,
  workspaces,
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
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="fixed inset-y-0 left-0 z-20 hidden w-62 xl:block">
          <SidebarContents
            organizationName={organizationName}
            organizationId={organizationId}
            workspaces={workspaces}
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
            organizationId={organizationId}
            workspaces={workspaces}
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
              organizationId={organizationId}
              workspaces={workspaces}
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
          <header className="flex h-14 items-center justify-between gap-3 border-b border-[var(--line)] px-3 sm:px-5 xl:px-7">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <Dialog.Trigger asChild>
                <button
                  type="button"
                  aria-label="Open navigation"
                  className="grid size-10 shrink-0 place-items-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b83f5] md:hidden"
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
                className="hidden size-10 shrink-0 place-items-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b83f5] md:grid xl:hidden"
              >
                {tabletExpanded ? (
                  <ChevronLeft size={18} />
                ) : (
                  <Menu size={19} />
                )}
              </button>
              <div className="flex min-w-0 items-center gap-2 md:hidden">
                <span className="font-medium text-[var(--muted-foreground)]">
                  BusinessFlow AI
                </span>
                <span className="px-2 text-[var(--muted-foreground)]">/</span>
                <span className="font-medium text-[var(--foreground)]">{label}</span>
              </div>
              <p className="hidden min-w-0 truncate text-sm text-[var(--muted)] md:block">
                <span>{section}</span>
                <span className="px-2 text-[var(--muted-foreground)]">/</span>
                <span className="font-medium text-[var(--foreground)]">{label}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <GlobalSearch />
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