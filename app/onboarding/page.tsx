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
      <main className="auth-page flex min-h-screen items-center px-6 py-12 sm:px-10 lg:px-12">
        <section className="mx-auto w-full max-w-[1280px]">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase text-[var(--accent)]">BusinessFlow AI</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--ink)] sm:text-5xl">We couldn’t load your account</h1>
            <p className="mt-7 text-base leading-6 text-[var(--muted)]">Please refresh the page. If the problem continues, check your database connection.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page flex min-h-screen items-center px-6 py-12 sm:px-10 lg:px-12">
      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-12 sm:max-lg:max-w-[640px] lg:grid-cols-2 lg:items-start lg:gap-20">
      <section className="w-full max-w-xl">
        <p className="text-sm font-semibold uppercase text-[var(--accent)]">BusinessFlow AI</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--ink)] sm:text-5xl">Set up your workspace</h1>
        <p className="mt-7 max-w-lg text-base leading-6 text-[var(--muted)]">Your workspace is where you’ll manage clients, projects, and AI-powered workflows.</p>
      </section>
      <WorkspaceForm />
      </div>
    </main>
  );
}