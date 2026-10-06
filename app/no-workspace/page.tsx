import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { WorkspaceForm } from "@/components/workspace/workspace-form";
import { resolveApplicationEntryState } from "@/lib/auth/lifecycle";
import { createClient } from "@/lib/supabase/server";

export default async function NoWorkspacePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const authUser = data.user;

  if (!authUser) {
    redirect("/login");
  }

  let state;
  try {
    state = await resolveApplicationEntryState(authUser);
  } catch {
    return (
      <AuthShell
        description="Please refresh the page. If the problem continues, check your database connection."
        title="We couldn't load your account"
      />
    );
  }

  if (state.kind === "READY") {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      description="You don't have access to any workspaces. Create a new workspace to get started."
      title="No workspace available"
    >
      <WorkspaceForm />
    </AuthShell>
  );
}
