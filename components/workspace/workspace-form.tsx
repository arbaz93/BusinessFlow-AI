"use client";

import { useActionState } from "react";
import { createWorkspace } from "@/app/actions/workspace";

const fieldClassName = "mt-2 h-11 w-full rounded-md border border-[var(--line-strong)] bg-transparent px-3.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";

export function WorkspaceForm() {
  const [state, action, pending] = useActionState(createWorkspace, {});

  return (
    <form action={action} className="w-full max-w-[600px] space-y-6 lg:justify-self-end">
      <label className="block text-[15px] font-normal text-[var(--muted)]" htmlFor="workspaceName">
        Workspace name
        <input
          className={fieldClassName}
          id="workspaceName"
          name="name"
          placeholder="PixelForge Studio"
          required
          minLength={2}
          maxLength={80}
        />
      </label>
      <label className="block text-[15px] font-normal text-[var(--muted)]" htmlFor="businessType">
        Business type
        <select className={fieldClassName} defaultValue="" id="businessType" name="businessType" required>
          <option disabled value="">Select business type</option>
          <option value="CREATIVE_AGENCY">Creative agency</option>
          <option value="MARKETING_AGENCY">Marketing agency</option>
          <option value="DESIGN_STUDIO">Design studio</option>
          <option value="SOFTWARE_DEVELOPMENT">Software development</option>
          <option value="CONSULTING">Consulting</option>
          <option value="OTHER">Other</option>
        </select>
      </label>
      {state.error && <p className="text-sm text-red-700" role="alert">{state.error}</p>}
      <button className="h-11 rounded-md bg-[var(--accent)] px-5 text-sm font-medium text-white transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60 max-sm:w-full" type="submit" disabled={pending}>
        {pending ? "Creating workspace..." : "Create workspace"}
      </button>
    </form>
  );
}