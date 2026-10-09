import * as React from "react";
import { cn } from "cn";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-base text-[var(--foreground)] shadow-xs transition-[color,box-shadow] outline-none placeholder:text-[var(--muted)] focus-visible:border-[var(--accent)] focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[var(--danger)] aria-invalid:ring-[var(--danger)]/20 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
