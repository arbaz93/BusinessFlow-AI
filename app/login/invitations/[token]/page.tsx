import { AuthForm } from "@/components/auth/auth-form";
import {
  getInvitationPath,
  isInvitationToken,
} from "@/lib/members/invitation-tokens";

export default async function InvitationLoginPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <AuthForm
      mode="login"
      returnTo={isInvitationToken(token) ? getInvitationPath(token) : undefined}
    />
  );
}
