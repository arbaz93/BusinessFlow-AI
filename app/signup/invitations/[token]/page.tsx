import { AuthForm } from "@/components/auth/auth-form";
import {
  getInvitationPath,
  isInvitationToken,
} from "@/lib/members/invitation-tokens";

export default async function InvitationSignupPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <AuthForm
      mode="signup"
      returnTo={isInvitationToken(token) ? getInvitationPath(token) : undefined}
    />
  );
}
