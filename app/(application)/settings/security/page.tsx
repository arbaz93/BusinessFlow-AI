import { SecurityForm } from "@/components/settings/security-form";
import { requireOrganization } from "@/lib/auth/dal";

export default async function SecuritySettingsPage() {
  await requireOrganization();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Security</h2>
        <p className="text-sm text-[var(--muted)]">
          Manage your password and session controls.
        </p>
      </div>

      <SecurityForm />
    </div>
  );
}
