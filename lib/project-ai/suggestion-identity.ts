import { createHash } from "node:crypto";
import type { ProjectIntelligence } from "@/lib/project-ai/schemas";

export type IdentifiedProjectIntelligence = Omit<ProjectIntelligence, "suggestedTasks"> & {
  suggestedTasks: Array<ProjectIntelligence["suggestedTasks"][number] & { suggestionId: string }>;
};

export function identifySuggestedTasks(
  analysisId: string,
  intelligence: ProjectIntelligence,
): IdentifiedProjectIntelligence {
  const duplicateCounts = new Map<string, number>();

  return {
    ...intelligence,
    suggestedTasks: intelligence.suggestedTasks.map((suggestion) => {
      const fingerprint = JSON.stringify({
        title: suggestion.title,
        description: suggestion.description,
        priority: suggestion.priority,
      });
      const duplicateNumber = duplicateCounts.get(fingerprint) ?? 0;
      duplicateCounts.set(fingerprint, duplicateNumber + 1);
      const suggestionId = createHash("sha256")
        .update(`${analysisId}:${fingerprint}:${duplicateNumber}`)
        .digest("hex");
      return { ...suggestion, suggestionId };
    }),
  };
}
