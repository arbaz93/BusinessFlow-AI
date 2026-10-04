"use client";

import { useState, useActionState } from "react";
import { Save } from "lucide-react";
import { updateProfile } from "@/app/actions/profile";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const inputClass =
  "h-10 w-full rounded-lg border border-[#27272a] bg-[#111113] px-3.5 text-sm text-white placeholder:text-white/30 focus-visible:border-[#a49bff] focus-visible:ring-[#a49bff]/20 focus-visible:ring-2 disabled:cursor-not-allowed";

export function ProfileForm({ name, email }: { name: string; email: string | null }) {
  const [state, action, pending] = useActionState(updateProfile, {});
  const [value, setValue] = useState(name);

  const unchanged = value.trim() === name;

  return (
    <form action={action} className="space-y-6">
      <div>
        <label htmlFor="profile-name" className="block text-sm font-medium text-[#f4f4f5]">
          Full name
        </label>
        <Input
          id="profile-name"
          name="name"
          maxLength={100}
          minLength={2}
          required
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          disabled={pending}
          className={inputClass}
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "profile-name-error" : undefined}
        />
        {state.error ? (
          <p id="profile-name-error" className="mt-1 text-xs text-[#fca5a5]" role="alert">
            {state.error}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="profile-email" className="block text-sm font-medium text-[#f4f4f5]">
          Email address
        </label>
        <Input
          id="profile-email"
          type="email"
          value={email ?? ""}
          readOnly
          aria-readonly
          className={cn(
            inputClass,
            "read-only:bg-[#0f0f12] read-only:text-white/50",
          )}
        />
        <p className="mt-1 text-xs text-[#71717a]">
          Email identity is managed by your authentication provider and cannot be changed here.
        </p>
      </div>

      {state.message ? (
        <p className="text-sm text-[#86efac]" role="status">
          {state.message}
        </p>
      ) : null}

      <div className="flex items-center justify-between border-t border-[#27272a] pt-4">
        <button
          type="submit"
          disabled={pending || !value.trim() || unchanged}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#7067e8] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#8178f0] disabled:cursor-not-allowed disabled:opacity-55"
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
              Save profile
            </>
          )}
        </button>
      </div>
    </form>
  );
}
