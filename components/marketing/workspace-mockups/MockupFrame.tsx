import { cn } from "@/lib/utils";

interface MockupFrameProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showChrome?: boolean;
  className?: string;
}

export function MockupFrame({
  title,
  subtitle,
  children,
  showChrome = true,
  className,
}: MockupFrameProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--line)] bg-[var(--panel)] overflow-hidden",
        className
      )}
      role="img"
      aria-label={`BusinessFlow ${title} workspace view`}
    >
      {showChrome && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--line)] bg-[var(--surface)]">
          <div className="flex gap-1.5">
            <div className="size-3 rounded-full bg-[var(--line-strong)]" aria-hidden="true" />
            <div className="size-3 rounded-full bg-[var(--line-strong)]" aria-hidden="true" />
            <div className="size-3 rounded-full bg-[var(--line-strong)]" aria-hidden="true" />
          </div>
          <div className="ml-3 flex-1 text-[11px] font-medium text-[var(--muted)] truncate">
            {title}
          </div>
          {subtitle && (
            <span className="text-[10px] text-[var(--muted-foreground)]">{subtitle}</span>
          )}
        </div>
      )}
      <div className="p-4 lg:p-6">{children}</div>
    </div>
  );
}