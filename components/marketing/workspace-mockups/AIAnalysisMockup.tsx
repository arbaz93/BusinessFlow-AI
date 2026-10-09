import { MockupFrame } from "./MockupFrame";
import { mockAIAnalysis, mockProject, priorityStyles, importanceStyles, severityStyles } from "./mockupData";
import { Sparkles, AlertTriangle, HelpCircle, CheckCheck, FileText } from "lucide-react";

interface AIAnalysisMockupProps {
  className?: string;
}

export function AIAnalysisMockup({ className }: AIAnalysisMockupProps) {
  const projectSlug = mockProject.name.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and");
  return (
    <MockupFrame title="AI Project Intelligence" subtitle={`/projects/${projectSlug}/ai`} className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--foreground)]">AI Analysis</h3>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--success)]">
            <span className="size-1.5 rounded-full bg-[var(--success)]" aria-hidden="true" />
            Analysis complete
          </span>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
          <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]/60 mb-2">Executive Summary</h4>
          <p className="text-sm leading-6 text-[var(--foreground)]/75">{mockAIAnalysis.summary}</p>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
          <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
            <FileText size={14} className="text-[var(--accent-muted)]" />
            Project Requirements
          </h4>
          <ul className="space-y-3">
            {mockAIAnalysis.requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 text-xs font-semibold text-[var(--accent-muted)]/60" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="text-sm font-medium text-[var(--foreground)]/85">{req.title}</h5>
                    <span className={`text-[10px] font-semibold uppercase tracking-[0.1em] ${importanceStyles[req.importance]}`}>
                      {req.importance.charAt(0) + req.importance.slice(1).toLowerCase()} importance
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[var(--foreground)]/60">{req.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
          <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
            <FileText size={14} className="text-[var(--accent-muted)]" />
            Expected Deliverables
          </h4>
          <ul className="space-y-3">
            {mockAIAnalysis.deliverables.map((deliv, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 size-1.5 rounded-full bg-[var(--accent-muted)]" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <h5 className="text-sm font-medium text-[var(--foreground)]/85">{deliv.title}</h5>
                  <p className="mt-1 text-sm leading-6 text-[var(--foreground)]/60">{deliv.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
          <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-[var(--warning)]" />
            Risks &amp; Considerations
          </h4>
          <ul className="space-y-3">
            {mockAIAnalysis.risks.map((risk, i) => (
              <li key={i} className="border-l-2 border-[var(--line-strong)]/30 pl-3 py-1">
                <div className="flex items-start justify-between gap-2">
                  <h5 className="text-sm font-medium text-[var(--foreground)]/85">{risk.title}</h5>
                  <span className={`text-[10px] font-semibold uppercase tracking-[0.1em] ${severityStyles[risk.severity]}`}>
                    {risk.severity.charAt(0) + risk.severity.slice(1).toLowerCase()}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-[var(--foreground)]/60">{risk.description}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
          <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
            <HelpCircle size={14} className="text-[var(--info)]" />
            Open Questions
          </h4>
          <ul className="space-y-3">
            {mockAIAnalysis.gaps.map((gap, i) => (
              <li key={i}>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-xs font-semibold text-[var(--accent-muted)]/60" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-sm font-medium text-[var(--foreground)]/85">{gap.question}</h5>
                    <p className="mt-1 text-sm leading-6 text-[var(--foreground)]/60">{gap.text}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
          <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">Suggested Tasks</h4>
          <div className="mb-2 text-xs text-[var(--foreground)]/60">AI-generated suggestions only — no Task is created until you approve.</div>
          <div className="space-y-2">
            {mockAIAnalysis.suggestedTasks.map((task, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)]">{task.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--muted-foreground)]">
                    <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium border ${priorityStyles[task.priority.charAt(0) + task.priority.slice(1).toLowerCase()]}`}>
                      {task.priority}
                    </span>
                    <span className="text-[var(--muted)]">{task.req}</span>
                    {task.risk && (
                      <>
                        <span className="text-[var(--muted-foreground)]">•</span>
                        <span className="text-[var(--warning)]">{task.risk}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-[11px] font-medium text-[var(--accent)] hover:text-[var(--accent-muted)]">Edit</button>
                  <button className="rounded bg-[var(--accent)] text-white text-[11px] font-medium px-3 py-1.5 hover:opacity-80 flex items-center gap-1">
                    <CheckCheck size={12} /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MockupFrame>
  );
}
