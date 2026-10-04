"use client";

import { useActionState } from "react";
import { createWorkspace } from "@/app/actions/workspace";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/field";
import { businessTypeLabels, businessTypeValues } from "@/lib/organizations/options";
import { cn } from "@/lib/utils";

export function WorkspaceForm() {
  const [state, action, pending] = useActionState(createWorkspace, {});

  return (
    <Card className="w-full shadow-[0_20px_60px_rgba(23,35,38,0.08)]">
      <CardContent className="p-6 sm:p-8">
        <form action={action} className="space-y-5">
          <TextField
            hint="This is how your team will see the workspace."
            id="workspaceName"
            label="Workspace name"
            maxLength={80}
            minLength={2}
            name="name"
            placeholder="PixelForge Studio"
            required
          />
          <SelectField defaultValue="" id="businessType" name="businessType" required label="Business type">
            <option disabled value="">
              Select business type
            </option>
            {businessTypeValues.map((value) => (
              <option key={value} value={value}>
                {businessTypeLabels[value]}
              </option>
            ))}
          </SelectField>

          {state.error ? <Alert role="alert">{state.error}</Alert> : null}

          <button
            className={cn(buttonVariants({ size: "lg" }), "w-full")}
            disabled={pending}
            type="submit"
          >
            {pending ? "Creating workspace..." : "Create workspace"}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
