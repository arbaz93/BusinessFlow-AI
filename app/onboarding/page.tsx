import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { WorkspaceForm } from "@/components/workspace/workspace-form";
import { requireUser } from "@/lib/auth/dal";
import { resolveApplicationEntryState } from "@/lib/auth/lifecycle";

export default async function OnboardingPage() {
  const authUser = await requireUser();

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

  if (state.kind === "UNAUTHENTICATED") {
    redirect("/login");
  }

  if (state.kind === "READY") redirect("/dashboard");

  if (state.kind === "INVITATION_AVAILABLE") {
    return (
      <AuthShell
        description="You have a pending workspace invitation. Use the invitation link to accept it and continue."
        title="Invitation pending"
      />
    );
  }

  if (state.kind === "NO_WORKSPACE") {
    return (
      <AuthShell
        description="Your workspace is where you'll manage clients, projects, and AI-powered workflows."
        title="Set up your workspace"
      >
        <WorkspaceForm />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      description="Please refresh the page. If the problem continues, check your database connection."
      title="We couldn't load your account"
    />
  );
}
