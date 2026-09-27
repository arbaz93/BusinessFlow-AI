"use client";

import { useActionState } from "react";
import { createWorkspace } from "@/app/actions/workspace";

export function WorkspaceForm() {
  const [state, action, pending] = useActionState(createWorkspace, {});

  return (
    <form action={action} className="mt-12 space-y-6">
      <label className="block text-sm font-medium text-[var(--ink)]" htmlFor="workspaceName">
        Workspace name
        <input
          className="mt-2 h-12 w-full rounded-lg border border-[var(--line-strong)] bg-white px-4 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
          id="workspaceName"
          name="name"
          placeholder="PixelForge Studio"
          required
          minLength={2}
          maxLength={80}
        />
      </label>
      {state.error && <p className="text-sm text-red-700" role="alert">{state.error}</p>}
      <button className="h-12 rounded-lg bg-[var(--accent)] px-6 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60 max-sm:w-full" type="submit" disabled={pending}>
        {pending ? "Creating workspace..." : "Create workspace"}
      </button>
    </form>
  );
}