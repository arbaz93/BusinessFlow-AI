import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { requireOrganization } from "@/lib/auth/dal";

export default async function ApplicationLayout({ children }: { children: ReactNode }) {
  const context = await requireOrganization();
  const userName = context.profile.name.trim() || context.profile.email.split("@")[0] || "Team member";

  return (
    <WorkspaceShell
      organizationName={context.organization.name}
      userName={userName}
      userEmail={context.profile.email}
      avatarUrl={context.profile.avatarUrl}
    >
      {children}
    </WorkspaceShell>
  );
}