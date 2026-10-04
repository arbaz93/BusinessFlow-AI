import type { ReactNode } from "react";
import { SettingsShell } from "@/components/settings/settings-shell";
import { requireOrganization } from "@/lib/auth/dal";

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const { organization } = await requireOrganization();

  return <SettingsShell organizationName={organization.name}>{children}</SettingsShell>;
}
