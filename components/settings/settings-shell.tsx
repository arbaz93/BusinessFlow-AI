"use client";

import { useState, type ReactNode } from "react";
import { Dialog } from "radix-ui";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

import { SettingsSidebar } from "@/components/settings/settings-sidebar";

const settingsPageTitles: Record<string, string> = {
  "/settings": "Settings",
  "/settings/profile": "Profile",
  "/settings/workspace": "Workspace",
  "/settings/members": "Members",
  "/settings/security": "Security",
  "/settings/delete-account": "Delete Account",
};

function getPageTitle(pathname: string): string {
  if (settingsPageTitles[pathname]) return settingsPageTitles[pathname];
  for (const [path, title] of Object.entries(settingsPageTitles)) {
    if (pathname.startsWith(`${path}/`)) return title;
  }
  return "Settings";
}

export function SettingsShell({
  organizationName,
  children,
}: {
  organizationName: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold tracking-[-0.03em] text-[var(--foreground)]">{title}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            <span>Workspace: </span>
            <span className="font-medium text-[var(--foreground)]">{organizationName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Open settings navigation"
            onClick={() => setDrawerOpen(true)}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff] md:hidden"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      <div className="flex gap-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-6 space-y-1.5">
            <SettingsSidebar />
          </div>
        </aside>

        <main id="main-content" className="flex-1 min-w-0 space-y-6">{children}</main>
      </div>

      <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 pt-8  md:hidden" />
          <Dialog.Content
            className="fixed inset-y-0 left-0 z-50 h-dvh bg-[var(--background)]/95 px-4 pt-8 w-72 max-w-[calc(100vw-1.5rem)] overflow-y-auto outline-none md:hidden"
            style={{
              paddingTop: "max(1.25rem, env(safe-area-inset-top))",
              paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
            }}
          >
            <Dialog.Title className="sr-only">Settings navigation</Dialog.Title>
            <div className="flex items-center justify-between pb-4">
              <span className="text-lg font-semibold text-[var(--foreground)]">Settings</span>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close navigation"
                  className="grid size-8 place-items-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]"
                  onClick={() => setDrawerOpen(false)}
                >
                  <X size={17} />
                </button>
              </Dialog.Close>
            </div>
            <SettingsSidebar onNavigate={() => setDrawerOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
