import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleAlert, CircleCheck } from "lucide-react";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm leading-6",
  {
    variants: {
      tone: {
        error:
          "border-[var(--danger-line)] bg-[var(--danger-surface)] text-[var(--danger)]",
        success:
          "border-[var(--success-line)] bg-[var(--success-surface)] text-[var(--success)]",
      },
    },
    defaultVariants: {
      tone: "error",
    },
  },
);

type AlertProps = React.ComponentProps<"p"> & VariantProps<typeof alertVariants>;

function Alert({ className, tone, children, ...props }: AlertProps) {
  const Icon = tone === "success" ? CircleCheck : CircleAlert;

  return (
    <p className={cn(alertVariants({ tone }), className)} {...props}>
      <Icon aria-hidden="true" className="mt-1 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export { Alert, alertVariants };
