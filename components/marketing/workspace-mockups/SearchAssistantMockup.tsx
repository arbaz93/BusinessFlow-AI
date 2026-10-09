import { MockupFrame } from "./MockupFrame";
import { mockSearchResults, mockAssistantMessages } from "./mockupData";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface SearchAssistantMockupProps {
  className?: string;
}

export function SearchAssistantMockup({ className }: SearchAssistantMockupProps) {
  return (
    <MockupFrame title="Search & Assistant" subtitle="Global search + AI Assistant" className={className}>
      <div className="space-y-4">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--line)] bg-[var(--background)]">
            <div className="relative max-w-xl">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                defaultValue="Brand & Website Refresh"
                className="w-full pl-10 pr-4 py-2 text-sm bg-transparent text-[var(--foreground)] placeholder-[var(--muted-foreground)] border-0 outline-none"
                readOnly
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 bg-[var(--panel)] border border-[var(--line)] rounded text-[var(--muted-foreground)]">⌘K</kbd>
            </div>
          </div>
          <div className="p-4 max-h-64 overflow-y-auto">
            <h5 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)] mb-3">Results</h5>
            <div className="space-y-2">
              {mockSearchResults.map((result, i) => (
                <button key={i} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--background)] text-left transition-colors">
                  <div className="size-8 rounded-lg bg-[var(--background)] flex items-center justify-center flex-shrink-0">
                    {result.type === "Project" && (
                      <svg className="size-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    )}
                    {result.type === "Task" && (
                      <svg className="size-4 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 002-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    )}
                    {result.type === "Document" && (
                      <svg className="size-4 text-[var(--info)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    )}
                    {result.type === "Client" && (
                      <svg className="size-4 text-[var(--warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">{result.title}</p>
                    <p className="text-[11px] text-[var(--muted-foreground)] truncate">{result.subtitle}</p>
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">{result.type}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--line)] bg-[var(--background)] flex items-center gap-3">
            <div className="size-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
              <Sparkles size={16} className="text-[var(--accent)]" />
            </div>
            <span className="text-sm font-medium text-[var(--foreground)]">AI Assistant</span>
            <span className="text-[10px] text-[var(--muted-foreground)] ml-auto">BusinessFlow</span>
          </div>
          <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
            {mockAssistantMessages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "assistant" ? "" : "flex-row-reverse"}`}>
                <div className="size-8 rounded-full flex items-center justify-center flex-shrink-0">
                  {msg.role === "user" ? (
                    <div className="size-4 rounded-full bg-[var(--accent)] flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">U</span>
                    </div>
                  ) : (
                    <Sparkles size={16} className="text-[var(--accent)]" />
                  )}
                </div>
                <div className={`max-w-[80%] ${msg.role === "user" ? "text-right" : ""}`}>
                  <div className={`inline-block rounded-2xl px-4 py-2 text-sm leading-6 ${msg.role === "user" ? "bg-[var(--accent)] text-white" : "bg-[var(--panel)] text-[var(--foreground)] border border-[var(--line)]"}`}>
                    <pre className="whitespace-pre-wrap font-inherit">{msg.content}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4 border-t border-[var(--line)]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask about your workspace..."
                className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none focus:border-[var(--accent)]"
              />
              <button className="rounded-lg bg-[var(--accent)] text-white p-2 hover:opacity-80">
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </MockupFrame>
  );
}