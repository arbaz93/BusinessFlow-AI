import { SecurityForm } from "@/components/settings/security-form";
import { requireOrganization } from "@/lib/auth/dal";

export default async function SecuritySettingsPage() {
  const { profile } = await requireOrganization();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-white">Security</h2>
        <p className="text-sm text-[#a1a1aa]">
          Manage your email identity, password, and session controls.
        </p>
      </div>

      <SecurityForm email={profile.email} />
    </div>
  );
}
