"use client";

import { useState } from "react";

export function InvitationLinkShare({ url }: { url: string }) {
  const [status, setStatus] = useState("");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("Invitation link copied.");
    } catch {
      setStatus("Couldn't copy the link. Select and copy it manually.");
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3">
      <label className="block text-xs font-medium text-[var(--foreground)]/65">
        Secure invitation link
        <input
          readOnly
          value={url}
          className="mt-1.5 h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2.5 text-xs text-[var(--foreground)]/75"
        />
      </label>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex h-8 items-center justify-center rounded-md border border-[var(--line)] px-3 text-xs font-medium text-[var(--foreground)]/80 hover:bg-[var(--surface)]"
      >
        Copy invitation link
      </button>
      {status ? <p className="text-xs text-[var(--success-line)]" role="status">{status}</p> : null}
    </div>
  );
}
