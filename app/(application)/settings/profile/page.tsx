import { ProfileForm } from "@/components/settings/profile-form";
import { requireOrganization } from "@/lib/auth/dal";

export default async function ProfileSettingsPage() {
  const { profile } = await requireOrganization();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Profile settings</h2>
        <p className="text-sm text-[var(--muted)]">
          Update the name and contact details for your account.
        </p>
      </div>

      <ProfileForm name={profile.name} email={profile.email} />
    </div>
  );
}
