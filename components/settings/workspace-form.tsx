"use client";

import { useActionState, useState } from "react";
import { updateOrganization } from "@/app/actions/organization";
import { Input } from "@/components/ui/input";
import { businessTypeLabels } from "@/lib/organizations/options";
import type { BusinessType } from "@/lib/organizations/options";
import { Save } from "lucide-react";

const inputClass =
  "h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus-visible:border-[#a49bff] focus-visible:ring-[#a49bff]/20 focus-visible:ring-2 disabled:cursor-not-allowed";

const selectClass =
  "h-10 w-full appearance-none rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus-visible:border-[#a49bff] focus-visible:ring-[#a49bff]/20 focus-visible:ring-2 disabled:cursor-not-allowed";

export function WorkspaceForm({
  initialName,
  initialBusinessType,
  slug,
  memberCount,
  canManage,
}: {
  initialName: string;
  initialBusinessType: BusinessType;
  slug: string;
  memberCount: number;
  canManage: boolean;
}) {
  const [state, action, pending] = useActionState(updateOrganization, {});
  const [name, setName] = useState(initialName);
  const [businessType, setBusinessType] = useState<BusinessType>(initialBusinessType);

  const unchanged = name === initialName && businessType === initialBusinessType;

  return (
    <form action={action} className="space-y-6">
      <div>
        <label htmlFor="workspace-name" className="block text-sm font-medium text-[var(--foreground)]">
          Workspace name
        </label>
        {canManage ? (
          <Input
            id="workspace-name"
            name="name"
            maxLength={80}
            minLength={2}
            required
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            disabled={pending}
            className={inputClass}
            aria-invalid={Boolean(state.error)}
            aria-describedby={state.error ? "workspace-name-error" : undefined}
          />
        ) : (
          <Input
            id="workspace-name"
            value={name}
            readOnly
            aria-readonly
            className={inputClass}
          />
        )}
        {state.error ? (
          <p id="workspace-name-error" className="mt-1 text-xs text-[#fca5a5]" role="alert">
            {state.error}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="workspace-business-type" className="block text-sm font-medium text-[var(--foreground)]">
          Business type
        </label>
        {canManage ? (
          <select
            id="workspace-business-type"
            name="businessType"
            value={businessType}
            onChange={(event) => setBusinessType(event.currentTarget.value as BusinessType)}
            disabled={pending}
            className={selectClass}
          >
            {Object.entries(businessTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        ) : (
          <Input
            id="workspace-business-type"
            value={businessTypeLabels[businessType]}
            readOnly
            aria-readonly
            className={inputClass}
          />
        )}
      </div>

      <div>
        <label htmlFor="workspace-slug" className="block text-sm font-medium text-[var(--foreground)]">
          Workspace URL
        </label>
        <Input
          id="workspace-slug"
          value={`businessflow.ai/w/${slug}`}
          readOnly
          aria-readonly
          className={inputClass}
        />
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">Workspace URLs cannot be changed here.</p>
      </div>

      <div>
        <label htmlFor="workspace-members" className="block text-sm font-medium text-[var(--foreground)]">
          Members
        </label>
        <Input
          id="workspace-members"
          value={`${memberCount} member${memberCount === 1 ? "" : "s"}`}
          readOnly
          aria-readonly
          className={inputClass}
        />
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          View members and manage invitations in Settings → Members.
        </p>
      </div>

      {state.message ? (
        <p className="text-sm text-[var(--success-line)]" role="status">
          {state.message}
        </p>
      ) : null}

      {!canManage ? (
        <div
          role="alert"
          className="rounded-lg border border-[#f59e0b]/20 bg-[#f59e0b]/10 px-3.5 py-2.5 text-sm text-[#fbbf24]"
        >
          Only workspace owners can manage workspace settings.
        </div>
      ) : (
        <div className="flex items-center justify-between border-t border-[var(--line)] pt-4">
          <button
            type="submit"
            disabled={pending || unchanged}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-foreground)] transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {pending ? (
              <>
                <span aria-hidden="true" className="animate-spin">
                  ·
                </span>
                Saving…
              </>
            ) : (
              <>
                <Save size={15} aria-hidden="true" />
                Save workspace
              </>
            )}
          </button>
        </div>
      )}
    </form>
  );
}
