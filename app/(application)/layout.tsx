import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { requireOrganization } from "@/lib/auth/dal";

export default async function ApplicationLayout({ children }: { children: ReactNode }) {
  const context = await requireOrganization();

  return (
    <WorkspaceShell organizationName={context.organization.name} userName={context.profile.name}>
      {children}
    </WorkspaceShell>
  );
}