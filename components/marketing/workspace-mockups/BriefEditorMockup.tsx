import { MockupFrame } from "./MockupFrame";
import { mockBriefSections, mockProject } from "./mockupData";
import { FileText } from "lucide-react";

interface BriefEditorMockupProps {
  className?: string;
}

export function BriefEditorMockup({ className }: BriefEditorMockupProps) {
  return (
    <MockupFrame title="Documents" subtitle={`/projects/${mockProject.name.toLowerCase().replace(/\s+/g, "-")}/documents`} className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-muted)]">Project</p>
            <h3 className="mt-0.5 text-sm font-semibold text-[var(--foreground)]">{mockProject.name} — Brief</h3>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-[11px] text-[var(--muted)] hover:text-[var(--foreground)]">Version 2</button>
            <button className="text-[11px] font-medium text-[var(--accent)] hover:text-[var(--accent-muted)]">Edit</button>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 space-y-6">
          {mockBriefSections.map((section, i) => (
            <div key={i} className="space-y-2">
              <h4 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-[0.08em]">{section.title}</h4>
              <div className="prose prose-invert max-w-none text-sm text-[var(--muted)] leading-7 whitespace-pre-line">
                {section.content}
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-[var(--line)]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-[0.08em]">Attachments</h4>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20">
                PRIMARY
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-[var(--background)] border border-[var(--line)]">
                <FileText className="size-5 text-[var(--muted)] flex-shrink-0" />
                <span className="text-sm text-[var(--foreground)] truncate flex-1">Brand & Website Refresh — Project Brief</span>
                <span className="text-[11px] text-[var(--muted-foreground)]">PDF · 2.4 MB</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-[var(--background)] border border-[var(--line)]">
                <svg className="size-5 text-[var(--muted)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-[var(--foreground)] truncate flex-1">Brand References</span>
                <span className="text-[11px] text-[var(--muted-foreground)]">FIG · 1.8 MB</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-[var(--background)] border border-[var(--line)]">
                <svg className="size-5 text-[var(--muted)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-[var(--foreground)] truncate flex-1">Content Notes</span>
                <span className="text-[11px] text-[var(--muted-foreground)]">TXT · 24 KB</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MockupFrame>
  );
}