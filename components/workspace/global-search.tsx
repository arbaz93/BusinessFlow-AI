"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Search, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { globalSearch, type GlobalSearchGroup } from "@/app/actions/search";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.closest("[role='textbox']") !== null ||
    target.isContentEditable
  );
}

export function GlobalSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const requestVersion = useRef(0);
  const shortcutLabel =
    typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac") ? "⌘" : "Ctrl";
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GlobalSearchGroup[]>([]);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const isTyping = isTypingTarget(target);

      if (isShortcut && !isTyping) {
        event.preventDefault();
        setOpen(true);
        return;
      }

      if (event.key === "Escape" && open) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open || !query.trim()) {
      return;
    }

    const version = ++requestVersion.current;

    const timer = window.setTimeout(async () => {
      if (version !== requestVersion.current) return;
      setLoading(true);
      const response = await globalSearch(query.trim());
      if (version !== requestVersion.current) return;

      setResults(response.groups);
      setLoading(false);
    }, 150);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, query]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
      setResults([]);
      setLoading(false);
      requestVersion.current += 1;
    }
  }

  function handleNavigate(href: string) {
    router.push(href);
    handleOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open search"
          className="hidden items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-2.5 py-2 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b83f5] md:flex"
        >
          <Search size={15} />
          <span className="font-medium">Search</span>
          <kbd className="hidden rounded border border-[var(--line)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)] lg:inline-flex">
            {shortcutLabel}K
          </kbd>
        </button>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open search"
          className="grid size-10 place-items-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b83f5] md:hidden"
        >
          <Search size={18} />
        </button>
      </div>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-60 bg-black/70 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-70 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-2xl outline-none"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <Dialog.Title className="sr-only">Global search</Dialog.Title>
          <div className="shrink-0 border-b border-[var(--line)] px-3 py-3 sm:px-4">
            <div className="flex items-center gap-3">
              <Search size={16} className="text-[var(--muted-foreground)]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search leads, clients, projects, tasks..."
                className="h-11 min-w-0 flex-1 border-0 bg-transparent text-base text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none md:text-sm"
                aria-label="Search the workspace"
              />
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                aria-label="Close search"
                className="grid size-8 place-items-center rounded-md text-[var(--muted)] transition-colors hover:bg-[var(--panel)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b83f5]"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 md:p-4">
            {loading && (
              <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-4 py-6 text-sm text-[var(--muted)]">
                Searching workspace...
              </div>
            )}

            {!loading && query.trim() && results.length === 0 && (
              <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--panel)] px-4 py-6 text-sm text-[var(--muted)]">
                No results found. Try another keyword.
              </div>
            )}

            {!loading && results.map((group) => (
              <section key={group.label} className="mb-5 last:mb-0">
                <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  {group.label}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <button
                      key={`${group.label}-${item.id}`}
                      type="button"
                      onClick={() => handleNavigate(item.href)}
                      className="flex w-full items-center gap-3 rounded-xl border border-transparent bg-[var(--surface)] px-3 py-2.5 text-left transition-colors hover:border-[var(--line)] hover:bg-[var(--panel)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b83f5]"
                    >
                      <div className="grid size-9 place-items-center rounded-lg bg-[var(--panel)] text-[11px] font-semibold text-[var(--accent-muted)]">
                        {group.label.slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-[var(--foreground)]">{item.title}</div>
                        <div className="truncate text-xs text-[var(--muted)]">{item.subtitle}</div>
                      </div>
                      <ArrowUpRight size={16} className="shrink-0 text-[var(--muted-foreground)]" />
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
