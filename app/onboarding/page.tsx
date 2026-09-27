import { redirect } from "next/navigation";
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
      <main className="min-h-screen bg-white px-6 py-16 sm:px-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-16">
        <section className="mx-auto w-full max-w-xl lg:justify-self-end">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">BusinessFlow AI</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[var(--ink)]">We couldn’t load your account</h1>
          <p className="mt-5 text-base leading-7 text-[var(--muted)]">Please refresh the page. If the problem continues, check your database connection.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-16 sm:px-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-16">
      <section className="mx-auto w-full max-w-xl lg:justify-self-end">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">BusinessFlow AI</p>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[var(--ink)] sm:text-5xl">Set up your workspace</h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-[var(--muted)]">Your workspace is where you’ll manage clients, projects, and AI-powered workflows.</p>
      </section>
      <div className="mx-auto w-full max-w-xl lg:justify-self-start"><WorkspaceForm /></div>
    </main>
  );
}