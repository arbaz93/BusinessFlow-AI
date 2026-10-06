import { DeleteAccountForm } from "@/components/settings/delete-account-form";
import { getAccountDeletionState } from "@/app/actions/account-deletion";

export default async function DeleteAccountSettingsPage() {
  const eligibility = await getAccountDeletionState();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Delete Account</h2>
        <p className="text-sm text-[var(--muted)]">
          Review your account deletion options below. This action is irreversible and removes your
          authentication identity and owned workspace data.
        </p>
      </div>

      <DeleteAccountForm eligibility={eligibility} />
    </div>
  );
}
