"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Search, Trash2, UploadCloud } from "lucide-react";
import {
  deleteProjectDocument,
  getProjectDocumentAccessUrl,
  saveProjectDocument,
  setPrimaryProjectBrief,
} from "@/app/actions/project-documents";
import { Input } from "@/components/ui/input";
import {
  PROJECT_DOCUMENT_ACCEPT_ATTRIBUTE,
  PROJECT_DOCUMENT_UPLOAD_HINT,
} from "@/lib/project-documents/files";
import { projectDocumentTypeLabels, projectDocumentTypeTone, projectDocumentTypeValues, type ProjectDocumentType } from "@/lib/project-documents/options";

type ProjectDocumentSummary = {
  id: string;
  name: string;
  originalName: string;
  documentType: ProjectDocumentType;
  mimeType: string | null;
  sizeBytes: number | null;
  hasFile: boolean;
  isPrimary: boolean;
  createdAt: string;
};

function formatFileSize(sizeBytes: number | null) {
  if (!sizeBytes) return "Unknown size";
  const units = ["B", "KB", "MB", "GB"];
  let value = sizeBytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDocumentDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ProjectDocumentsWorkspace({
  projectId,
  projectName,
  documents,
}: {
  projectId: string;
  projectName: string;
  documents: ProjectDocumentSummary[];
}) {
  const [uploadState, uploadAction, uploadPending] = useActionState(saveProjectDocument, {});
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState<ProjectDocumentType | "ALL">("ALL");
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function handleDocumentAccess(documentId: string, mode: "view" | "download") {
    setPendingActionId(documentId);
    setStatusMessage(null);

    const result = await getProjectDocumentAccessUrl(documentId, projectId, mode);
    setPendingActionId(null);

    if (result.error || !result.url) {
      setStatusMessage(result.error ?? "This document could not be opened.");
      return;
    }

    if (mode === "download") {
      const link = document.createElement("a");
      link.href = result.url;
      link.rel = "noopener noreferrer";
      link.target = "_blank";
      link.download = "";
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }

    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  async function handleDocumentDelete(formData: FormData, documentId: string) {
    const documentName = documents.find((document) => document.id === documentId)?.name ?? "this document";
    if (!window.confirm(`Permanently delete "${documentName}"?`)) return;

    setPendingActionId(documentId);
    setStatusMessage(null);

    try {
      const result = await deleteProjectDocument(formData);
      if (result.error) {
        setStatusMessage(result.error);
        return;
      }
      router.refresh();
    } catch {
      setStatusMessage("The document could not be deleted. Please try again.");
    } finally {
      setPendingActionId(null);
    }
  }

  async function handleSetPrimaryBrief(formData: FormData, documentId: string) {
    setPendingActionId(documentId);
    setStatusMessage(null);

    try {
      const result = await setPrimaryProjectBrief(formData);
      if (result.error) {
        setStatusMessage(result.error);
        return;
      }
      router.refresh();
    } catch {
      setStatusMessage("The primary brief could not be updated. Please try again.");
    } finally {
      setPendingActionId(null);
    }
  }

  const visibleDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return documents.filter((document) => {
      if (documentTypeFilter !== "ALL" && document.documentType !== documentTypeFilter) return false;
      if (!query) return true;
      const haystack = `${document.name} ${document.originalName} ${projectDocumentTypeLabels[document.documentType]}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [documentTypeFilter, documents, search]);

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--info-line)]">Project resources</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">Documents</h2>
          <p className="mt-1 text-sm text-[var(--foreground)]/50">Keep project briefs, client assets, references, and other project files organized.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--foreground)]/60">
          <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--foreground)]/70">{documents.length} files</span>
        </div>
      </section>

      {statusMessage && (
        <div role="status" className="rounded-md border border-[#f59e0b]/25 bg-[#f59e0b]/10 px-3 py-2 text-sm text-[#fbbf24]">
          {statusMessage}
        </div>
      )}

      <section className="rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-md border border-[#a49bff]/30 bg-[#a49bff]/10 text-[var(--accent-muted)]">
                <UploadCloud size={16} />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--foreground)]">Upload Document</h3>
                <p className="text-xs text-[var(--foreground)]/45">Add a file to {projectName}.</p>
              </div>
            </div>
          </div>

          <form action={uploadAction} className="grid gap-3 lg:grid-cols-[minmax(160px,1fr)_minmax(180px,0.7fr)_minmax(160px,1fr)_auto]">
            <input type="hidden" name="projectId" value={projectId} />
            <label className="space-y-1.5 text-sm text-[var(--foreground)]/70">
              <span>Document name</span>
              <Input name="name" placeholder="Project brief v2" className="border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--foreground)]/30" required />
            </label>
            <label className="space-y-1.5 text-sm text-[var(--foreground)]/70">
              <span>Document type</span>
              <select name="documentType" defaultValue="PROJECT_BRIEF" className="h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[#a49bff] focus:ring-2 focus:ring-[#a49bff]/20">
                {projectDocumentTypeValues.map((type) => (
                  <option key={type} value={type}>{projectDocumentTypeLabels[type]}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm text-[var(--foreground)]/70">
              <span>File</span>
              <input type="file" name="file" accept={PROJECT_DOCUMENT_ACCEPT_ATTRIBUTE} className="flex h-10 w-full cursor-pointer rounded-md border border-dashed border-[var(--line)] bg-[var(--surface)] px-3 py-[5px] text-sm text-[var(--foreground)]/70 file:mr-3 file:rounded-md file:border-0 file:bg-white/5 file:px-2 file:py-1 file:text-[var(--foreground)]/80" required />
              <span className="text-xs text-[var(--foreground)]/45">{PROJECT_DOCUMENT_UPLOAD_HINT}</span>
            </label>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]/70">
                <input type="checkbox" name="isPrimary" value="true" className="h-4 w-4 rounded border-[var(--line)] bg-[var(--surface)] text-[var(--accent-muted)] focus:ring-[#a49bff]" />
                Primary brief
              </label>
            </div>
            <div className="lg:col-span-4 flex justify-end">
              <button type="submit" disabled={uploadPending} className="inline-flex h-10 items-center justify-center rounded-md bg-[#a49bff] px-4 text-sm font-medium text-[#101018] transition-colors hover:bg-[#b3a8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a49bff] disabled:cursor-wait disabled:opacity-60">
                {uploadPending ? "Uploading…" : "Upload Document"}
              </button>
            </div>
            {uploadState.error && (
              <p role="alert" className="lg:col-span-4 rounded-md border border-[var(--danger-border)]/20 bg-[var(--danger)]/[0.08] px-3 py-2 text-sm text-[#fca5a5]">
                {uploadState.error}
              </p>
            )}
            {uploadState.success && (
              <p role="status" className="lg:col-span-4 rounded-md border border-[var(--success-border)]/20 bg-[var(--success-surface)] px-3 py-2 text-sm text-[var(--success-line)]">
                Document uploaded successfully.
              </p>
            )}
          </form>
        </div>
      </section>

      <section className="rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-3 sm:p-4" aria-label="Document filters">
        <div className="grid gap-2 md:grid-cols-[minmax(200px,1fr)_minmax(170px,220px)]">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground)]/35" />
            <Input value={search} onChange={(event) => setSearch(event.currentTarget.value)} aria-label="Search project documents" placeholder="Search files…" className="h-10 border-[var(--line)] bg-[var(--surface)] pl-9 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/35 dark:bg-[var(--surface)]" />
          </div>
          <select value={documentTypeFilter} onChange={(event) => setDocumentTypeFilter(event.currentTarget.value as ProjectDocumentType | "ALL")} className="h-10 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[#a49bff] focus:ring-2 focus:ring-[#a49bff]/20">
            <option value="ALL">All document types</option>
            {projectDocumentTypeValues.map((type) => (
              <option key={type} value={type}>{projectDocumentTypeLabels[type]}</option>
            ))}
          </select>
        </div>
      </section>

      {visibleDocuments.length ? (
        <ul className="space-y-3">
          {visibleDocuments.map((document) => (
            <li key={document.id} className="rounded-[10px] border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${projectDocumentTypeTone[document.documentType]}`}>{projectDocumentTypeLabels[document.documentType]}</span>
                    {document.isPrimary && <span className="inline-flex rounded-full border border-[#a49bff]/25 bg-[#a49bff]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--accent-muted)]">Primary brief</span>}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-md border border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)]/60">
                      <FileText size={15} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-base font-medium text-[var(--foreground)]">{document.name}</p>
                      <p className="text-xs text-[var(--foreground)]/45">{document.originalName} · {formatFileSize(document.sizeBytes)} · {formatDocumentDate(document.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {document.hasFile ? (
                    <button
                      type="button"
                      onClick={() => handleDocumentAccess(document.id, "view")}
                      disabled={pendingActionId === document.id}
                      className="inline-flex h-9 items-center rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)]/80 hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pendingActionId === document.id ? "Opening…" : "Open"}
                    </button>
                  ) : (
                    <span className="inline-flex h-9 items-center rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)]/45">File unavailable</span>
                  )}

                  {document.hasFile ? (
                    <button
                      type="button"
                      onClick={() => handleDocumentAccess(document.id, "download")}
                      disabled={pendingActionId === document.id}
                      className="inline-flex h-9 items-center rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)]/80 hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pendingActionId === document.id ? "Preparing…" : "Download"}
                    </button>
                  ) : (
                    <span className="inline-flex h-9 items-center rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)]/45">Unavailable</span>
                  )}

                  {document.documentType === "PROJECT_BRIEF" && !document.isPrimary && (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleSetPrimaryBrief(new FormData(event.currentTarget), document.id);
                      }}
                    >
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="documentId" value={document.id} />
                      <button
                        type="submit"
                        disabled={pendingActionId === document.id}
                        className="inline-flex h-9 items-center rounded-md border border-[#a49bff]/25 bg-[#a49bff]/10 px-3 text-sm text-[var(--accent-muted)] hover:bg-[#a49bff]/15 disabled:cursor-wait disabled:opacity-60"
                      >
                        {pendingActionId === document.id ? "Updating…" : "Set as primary"}
                      </button>
                    </form>
                  )}

                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleDocumentDelete(new FormData(event.currentTarget), document.id);
                    }}
                  >
                    <input type="hidden" name="projectId" value={projectId} />
                    <input type="hidden" name="documentId" value={document.id} />
                    <button
                      type="submit"
                      disabled={pendingActionId === document.id}
                      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#ef4444]/25 bg-[#ef4444]/10 px-3 text-sm text-[#fca5a5] transition-colors hover:bg-[#ef4444]/15 disabled:cursor-wait disabled:opacity-60"
                    >
                      <Trash2 size={14} />
                      {pendingActionId === document.id ? "Deleting…" : "Delete"}
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-[10px] border border-dashed border-[var(--line)] bg-[var(--panel)] p-8 text-center text-sm text-[var(--foreground)]/45">
          No documents match the current filter.
        </div>
      )}
    </div>
  );
}
