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
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold tracking-[-0.03em] text-[#f4f4f5]">{title}</h1>
          <p className="mt-1 text-sm text-[#a1a1aa]">
            <span>Workspace: </span>
            <span className="font-medium text-white/80">{organizationName}</span>
          </p>
        </div>
        <button
          type="button"
          aria-label="Open settings navigation"
          onClick={() => setDrawerOpen(true)}
          className="grid size-9 shrink-0 place-items-center rounded-lg text-white/65 transition-colors hover:bg-white/6 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff] md:hidden"
        >
          <Menu size={18} />
        </button>
      </header>

      <div className="flex gap-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-6 space-y-1.5">
            <SettingsSidebar />
          </div>
        </aside>

        <main className="flex-1 min-w-0 space-y-6">{children}</main>
      </div>

      <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/65 md:hidden" />
          <Dialog.Content
            className="fixed inset-y-0 left-0 z-50 h-dvh w-72 max-w-[calc(100vw-1.5rem)] overflow-y-auto outline-none md:hidden"
            style={{
              paddingTop: "max(1.25rem, env(safe-area-inset-top))",
              paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
            }}
          >
            <Dialog.Title className="sr-only">Settings navigation</Dialog.Title>
            <div className="flex items-center justify-between pb-4">
              <span className="text-sm font-semibold text-white/80">Settings</span>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close navigation"
                  className="grid size-8 place-items-center rounded-lg text-white/55 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]"
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
