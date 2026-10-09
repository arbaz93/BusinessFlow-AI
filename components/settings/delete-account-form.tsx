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
  "h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent)]/20 focus-visible:ring-2 disabled:cursor-not-allowed";

export function DeleteAccountForm({ eligibility }: { eligibility: DeletionEligibility }) {
  const [state, action, pending] = useActionState(deleteAccountAction, {});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");

  if (!eligibility.eligible) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--warning)]">
            <AlertCircle size={18} />
            Account deletion is unavailable
          </h3>
          <p className="mt-2 max-w-lg text-sm text-[var(--muted)]">{eligibility.reason}</p>
          {eligibility.blockedWorkspace ? (
            <p className="mt-2 text-sm text-[var(--muted)]">
              Transfer ownership of{" "}
              <span className="font-medium text-[var(--foreground)]">{eligibility.blockedWorkspace.name}</span>{" "}
              (currently {eligibility.blockedWorkspace.memberCount} members) or remove the other
              members, then return to delete your account.
            </p>
          ) : null}
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">
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
      <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-6">
        <h3 className="text-lg font-semibold text-[var(--danger)]">Danger Zone</h3>
        <p className="mt-2 max-w-lg text-sm text-[var(--muted)]">
          Permanently delete your BusinessFlow account. This removes your authentication identity
          and, for workspaces you own outright, the workspace and its business data (leads,
          clients, projects, tasks, documents, AI analyses, and conversations). This action cannot
          be undone.
        </p>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--danger)] transition-colors hover:bg-[var(--danger)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <Trash2 size={15} aria-hidden="true" />
          Delete Account
        </button>
      </div>

      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/65" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 grid w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl border border-[var(--danger-border)]/30 bg-[var(--panel)] p-6 text-[var(--foreground)] shadow-2xl outline-none"
            aria-describedby="delete-account-description"
          >
            <Dialog.Title className="text-lg font-semibold text-[var(--danger)]">
              Delete your account
            </Dialog.Title>

            <div id="delete-account-description" className="space-y-3 text-sm text-[var(--muted)]">
              <p>This action is irreversible. It will:</p>
              <ul className="list-disc pl-5 text-sm text-[var(--muted)]">
                <li>Remove your Supabase Auth identity and invalidate every session.</li>
                <li>
                  Delete this workspace and all of its business data (leads, clients, projects,
                  tasks, documents, AI analyses, and conversations).
                </li>
                <li>Delete private storage objects belonging to this workspace.</li>
              </ul>
              <p>
                Any workspace where you are only a member (not the owner) is left intact; only your
                membership is removed.
              </p>
            </div>

            <form action={action} className="mt-2 space-y-4">
              <input type="hidden" name="confirmation" value={confirmation} />
              <input type="hidden" name="password" value={password} />

              <div>
                <label
                  htmlFor="delete-account-confirmation"
                  className="block text-sm font-medium text-[var(--foreground)]"
                >
                  Type <span className="font-bold text-[var(--foreground)]">{ACCOUNT_DELETION_CONFIRMATION_PHRASE}</span> to confirm
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
                  className="block text-sm font-medium text-[var(--foreground)]"
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
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Re-entering your password confirms this is really you before the account is removed.
                </p>
              </div>

              {state.error ? (
                <p id="delete-account-error" className="text-xs text-[var(--danger-line)]" role="alert">
                  {state.error}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-3 border-t border-[var(--line)] pt-4">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  disabled={pending}
                  className="h-10 rounded-lg border border-[var(--line)] px-4 text-sm font-medium text-[var(--foreground)]/70 transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--danger)] px-4 text-sm font-semibold text-[var(--foreground)] transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
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
