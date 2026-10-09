import Link from "next/link";
import { InvitationStatus } from "@/app/generated/prisma/enums";
import { AcceptInvitationForm } from "@/components/invitations/accept-invitation-form";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import {
  hashInvitationToken,
  isInvitationToken,
  isInvitationExpired,
} from "@/lib/members/invitation-tokens";
import { signOut } from "@/app/actions/auth";

function InvitationMessage({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <section className="space-y-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
      <h2 className="text-base font-semibold text-[var(--foreground)]">{title}</h2>
      <p className="text-sm leading-6 text-[var(--muted)]">{message}</p>
    </section>
  );
}

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const returnTo = `/invitations/${token}`;
  const invalid = (
    <InvitationMessage
      title="Invitation unavailable"
      message="This invitation is no longer valid. Ask a workspace owner for a new invitation link."
    />
  );

  if (!isInvitationToken(token)) {
    return <InvitationLayout>{invalid}</InvitationLayout>;
  }

  const invitation = await prisma.organizationInvitation.findFirst({
    where: { tokenHash: hashInvitationToken(token) },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
      organization: { select: { name: true } },
      invitedBy: { select: { name: true } },
    },
  });

  if (!invitation) return <InvitationLayout>{invalid}</InvitationLayout>;

  let status = invitation.status;
  if (
    status === InvitationStatus.PENDING &&
    isInvitationExpired(invitation.expiresAt)
  ) {
    await prisma.organizationInvitation.updateMany({
      where: {
        id: invitation.id,
        tokenHash: hashInvitationToken(token),
        status: InvitationStatus.PENDING,
      },
      data: { status: InvitationStatus.EXPIRED },
    });
    status = InvitationStatus.EXPIRED;
  }

  if (status === InvitationStatus.ACCEPTED) {
    return (
      <InvitationLayout>
        <InvitationMessage
          title="Invitation already accepted"
          message="This invitation has already been accepted. Sign in to access your workspace."
        />
        <Link className="text-sm font-medium text-[var(--accent-muted)] underline" href="/login">
          Sign in
        </Link>
      </InvitationLayout>
    );
  }

  if (status === InvitationStatus.CANCELLED) {
    return (
      <InvitationLayout>
        <InvitationMessage
          title="Invitation no longer valid"
          message="A workspace owner cancelled this invitation. Ask them to create a new one if you still need access."
        />
      </InvitationLayout>
    );
  }

  if (status === InvitationStatus.EXPIRED) {
    return (
      <InvitationLayout>
        <InvitationMessage
          title="Invitation expired"
          message="This invitation has expired. Ask a workspace owner to send a new invitation."
        />
      </InvitationLayout>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const authUser = error ? null : data.user;
  const verifiedEmail = authUser?.email_confirmed_at;
  const matchesEmail =
    authUser?.email?.trim().toLowerCase() === invitation.email.trim().toLowerCase();

  return (
    <InvitationLayout>
      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--accent-muted)]">Workspace invitation</p>
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          You&apos;ve been invited to join {invitation.organization.name}
        </h2>
        <p className="text-sm leading-6 text-[var(--muted)]">
          {invitation.invitedBy.name} invited <strong className="font-medium text-[var(--foreground)]">{invitation.email}</strong> as a workspace member.
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          Expires {invitation.expiresAt?.toLocaleDateString() ?? "in 7 days"}.
        </p>
      </div>

      {!authUser ? (
        <section className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="text-sm text-[var(--muted)]">
            Sign in or create an account using the invited email address to accept.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-foreground)] hover:brightness-110"
              href={`/login${returnTo}`}
            >
              Sign in
            </Link>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--line)] px-4 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--panel)]"
              href={`/signup${returnTo}`}
            >
              Create account
            </Link>
          </div>
        </section>
      ) : !verifiedEmail ? (
        <InvitationMessage
          title="Verify your email first"
          message={`Confirm ${invitation.email} using the verification email, then reopen this invitation link to continue.`}
        />
      ) : !matchesEmail ? (
        <section className="space-y-3 rounded-xl border border-[#fca5a5]/20 bg-[#fca5a5]/5 p-4">
          <p className="text-sm leading-6 text-[#fecaca]" role="alert">
            You are signed in as {authUser.email}. This invitation is for {invitation.email}.
            Sign out and use the invited account to accept it.
          </p>
          <form action={signOut}>
            <input type="hidden" name="returnTo" value={returnTo} />
            <button className="text-sm font-medium text-[var(--foreground)] underline" type="submit">
              Sign out and switch account
            </button>
          </form>
        </section>
      ) : (
        <AcceptInvitationForm key={token} token={token} />
      )}
    </InvitationLayout>
  );
}

function InvitationLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
      <div className="w-full max-w-lg space-y-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl sm:p-8">
        <Link href="/" className="text-sm font-semibold tracking-wide text-[var(--foreground)]">
          BusinessFlow AI
        </Link>
        {children}
      </div>
    </main>
  );
}
