import { MockupFrame } from "./MockupFrame";
import { mockAIAnalysis, mockProject, priorityStyles } from "./mockupData";
import { cn } from "@/lib/utils";
import { Sparkles, AlertTriangle, HelpCircle, CheckCheck } from "lucide-react";

interface AIAnalysisMockupProps {
  className?: string;
}

export function AIAnalysisMockup({ className }: AIAnalysisMockupProps) {
  return (
    <MockupFrame title="AI Project Intelligence" subtitle={`/projects/${mockProject.name.toLowerCase().replace(/\s+/g, "-")}/ai`} className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">AI Analysis</h3>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--success)] font-medium flex items-center gap-1">
              <Sparkles size={12} /> Analysis complete
            </span>
            <button className="rounded-lg bg-[var(--accent)] text-white text-[11px] font-medium px-3 py-1.5 hover:opacity-80">
              Re-run Analysis
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
          <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
            <Sparkles size={14} className="text-[var(--accent)]" />
            Source: {mockAIAnalysis.source}
          </h4>
          <p className="mt-2 text-sm text-[var(--muted)] leading-6">{mockAIAnalysis.summary}</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
              <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
                <span className="size-2 rounded-full bg-[var(--accent)]" aria-hidden="true" />
                Requirements Extracted
              </h4>
              <ul className="space-y-2">
                {mockAIAnalysis.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                    <span className="mt-1 size-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" aria-hidden="true" />
                    <span>{req.text}</span>
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${priorityStyles[req.priority]}`}>
                      {req.priority}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
              <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
                <AlertTriangle size={14} className="text-[var(--warning)]" />
                Risks Identified
              </h4>
              <ul className="space-y-2">
                {mockAIAnalysis.risks.map((risk, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                    <span className="mt-1 size-1.5 rounded-full bg-[var(--warning)] flex-shrink-0" aria-hidden="true" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
              <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
                <HelpCircle size={14} className="text-[var(--info)]" />
                Missing Information
              </h4>
              <ul className="space-y-2">
                {mockAIAnalysis.gaps.map((gap, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                    <span className="mt-1 size-1.5 rounded-full bg-[var(--info)] flex-shrink-0" aria-hidden="true" />
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
              <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">Suggested Tasks</h4>
              <div className="space-y-2">
                {mockAIAnalysis.suggestedTasks.map((task, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[var(--background)] border border-[var(--line)]">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)]">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--muted-foreground)]">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${priorityStyles[task.priority]}`}>
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
        </div>
      </div>
    </MockupFrame>
  );
}