"use client";

import { useActionState, useState } from "react";
import { Dialog } from "radix-ui";
import { AlertCircle, Trash2 } from "lucide-react";
import { deleteAccountAction } from "@/app/actions/account-deletion";
import {
  ACCOUNT_DELETION_CONFIRMATION_PHRASE,
  type DeletionEligibility,
} from "@/lib/organizations/deletion-eligibility";

const inputClass =
  "h-10 w-full rounded-lg border border-[#27272a] bg-[#111113] px-3.5 text-sm text-white placeholder:text-white/30 focus-visible:border-[#a49bff] focus-visible:ring-[#a49bff]/20 focus-visible:ring-2 disabled:cursor-not-allowed";

export function DeleteAccountForm({ eligibility }: { eligibility: DeletionEligibility }) {
  const [state, action, pending] = useActionState(deleteAccountAction, {});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");

  if (!eligibility.eligible) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-[#fbbf24]">
            <AlertCircle size={18} />
            Account deletion is unavailable
          </h3>
          <p className="mt-2 max-w-lg text-sm text-[#a1a1aa]">{eligibility.reason}</p>
          {eligibility.blockedWorkspace ? (
            <p className="mt-2 text-sm text-[#a1a1aa]">
              Transfer ownership of{" "}
              <span className="font-medium text-white">{eligibility.blockedWorkspace.name}</span>{" "}
              (currently {eligibility.blockedWorkspace.memberCount} members) or remove the other
              members, then return to delete your account.
            </p>
          ) : null}
        </div>
        <p className="text-xs text-[#71717a]">
          Workspace deletion is a separate operation and is not available from Settings.
        </p>
      </div>
    );
  }

  const phraseMatches =
    confirmation.trim().toUpperCase() === ACCOUNT_DELETION_CONFIRMATION_PHRASE;
  const canSubmit = phraseMatches && password.length >= 1 && !pending;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-6">
        <h3 className="text-lg font-semibold text-[#fca5a5]">Danger Zone</h3>
        <p className="mt-2 max-w-lg text-sm text-[#a1a1aa]">
          Permanently delete your BusinessFlow account. This removes your authentication identity
          and, for workspaces you own outright, the workspace and its business data (leads,
          clients, projects, tasks, documents, AI analyses, and conversations). This action cannot
          be undone.
        </p>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#27272a] bg-[#111113] px-4 text-sm font-medium text-[#fca5a5] transition-colors hover:bg-[#ef4444]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff]"
        >
          <Trash2 size={15} aria-hidden="true" />
          Delete Account
        </button>
      </div>

      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/65" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 grid w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl border border-[#ef4444]/30 bg-[#18181b] p-6 text-[#f4f4f5] shadow-2xl outline-none"
            aria-describedby="delete-account-description"
          >
            <Dialog.Title className="text-lg font-semibold text-[#fca5a5]">
              Delete your account
            </Dialog.Title>

            <Dialog.Description id="delete-account-description" className="text-sm text-[#a1a1ab]">
              This action is irreversible. It will:
              <ul className="mt-2 space-y-1 list-disc pl-4 text-sm text-[#a1a1aa]">
                <li>Remove your Supabase Auth identity and invalidate every session.</li>
                <li>
                  Delete this workspace and all of its business data (leads, clients, projects,
                  tasks, documents, AI analyses, and conversations).
                </li>
                <li>Delete private storage objects belonging to this workspace.</li>
              </ul>
              Any workspace where you are only a member (not the owner) is left intact; only your
              membership is removed.
            </Dialog.Description>

            <form action={action} className="mt-2 space-y-4">
              <input type="hidden" name="confirmation" value={confirmation} />
              <input type="hidden" name="password" value={password} />

              <div>
                <label
                  htmlFor="delete-account-confirmation"
                  className="block text-sm font-medium text-[#f4f4f5]"
                >
                  Type <span className="font-bold text-white">{ACCOUNT_DELETION_CONFIRMATION_PHRASE}</span> to confirm
                </label>
                <input
                  id="delete-account-confirmation"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.currentTarget.value)}
                  disabled={pending}
                  className={inputClass}
                  aria-invalid={Boolean(state.error)}
                  aria-describedby={state.error ? "delete-account-error" : undefined}
                  placeholder={ACCOUNT_DELETION_CONFIRMATION_PHRASE}
                />
              </div>

              <div>
                <label
                  htmlFor="delete-account-password"
                  className="block text-sm font-medium text-[#f4f4f5]"
                >
                  Your password
                </label>
                <input
                  id="delete-account-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.currentTarget.value)}
                  disabled={pending}
                  className={inputClass}
                  placeholder="Enter your password to re-authenticate"
                />
                <p className="mt-1 text-xs text-[#71717a]">
                  Re-entering your password confirms this is really you before the account is removed.
                </p>
              </div>

              {state.error ? (
                <p id="delete-account-error" className="text-xs text-[#fca5a5]" role="alert">
                  {state.error}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-3 border-t border-[#27272a] pt-4">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  disabled={pending}
                  className="h-10 rounded-lg border border-[#27272a] px-4 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#ef4444] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#ef4444]/90 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {pending ? "Deleting…" : "Delete account permanently"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
