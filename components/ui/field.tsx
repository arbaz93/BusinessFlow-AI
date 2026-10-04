import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const controlClassName =
  "h-11 w-full rounded-lg border border-[var(--line-strong)] bg-white px-3.5 text-sm text-black/80 outline-none transition-colors placeholder:text-[var(--muted)] focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/20 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-[var(--danger)] aria-invalid:ring-2 aria-invalid:ring-[var(--danger)]/20";

type BaseFieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

function FieldFrame({
  id,
  label,
  hint,
  error,
  children,
}: BaseFieldProps & { children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--ink)]" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p className="text-xs leading-5 text-[var(--muted)]" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs leading-5 text-[var(--danger)]" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type TextFieldProps = BaseFieldProps & Omit<React.ComponentProps<"input">, "id" | "className">;

function TextField({ id, label, hint, error, ...props }: TextFieldProps) {
  return (
    <FieldFrame error={error} hint={hint} id={id} label={label}>
      <input
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        aria-invalid={error ? true : undefined}
        className={controlClassName}
        id={id}
        {...props}
      />
    </FieldFrame>
  );
}

type SelectFieldProps = BaseFieldProps &
  Omit<React.ComponentProps<"select">, "id" | "className">;

function SelectField({ id, label, hint, error, ...props }: SelectFieldProps) {
  return (
    <FieldFrame error={error} hint={hint} id={id} label={label}>
      <div className="relative">
        <select
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          aria-invalid={error ? true : undefined}
          className={cn(controlClassName, "cursor-pointer appearance-none pr-10")}
          id={id}
          {...props}
        />
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]"
        />
      </div>
    </FieldFrame>
  );
}

export { SelectField, TextField, controlClassName };
