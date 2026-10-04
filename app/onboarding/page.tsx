import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { WorkspaceForm } from "@/components/workspace/workspace-form";
import { getOrganizationContext, requireUser } from "@/lib/auth/dal";

export default async function OnboardingPage() {
  const authUser = await requireUser();

  try {
    const context = await getOrganizationContext(authUser);
    if (context.membership) redirect("/dashboard");
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    return (
      <AuthShell
        description="Please refresh the page. If the problem continues, check your database connection."
        title="We couldn’t load your account"
      />
    );
  }

  return (
    <AuthShell
      description="Your workspace is where you’ll manage clients, projects, and AI-powered workflows."
      title="Set up your workspace"
    >
      <WorkspaceForm />
    </AuthShell>
  );
}
