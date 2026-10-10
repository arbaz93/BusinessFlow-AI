import { inferAssistantContextNeeds, type AssistantContextNeeds } from "@/lib/assistant/context/intent";

const activityStatusLabels: { keys: (keyof AssistantContextNeeds)[]; label: string }[] = [
  { keys: ["tasks"], label: "Checking related tasks…" },
  { keys: ["aiIntelligence"], label: "Checking the project analysis…" },
  { keys: ["briefContent"], label: "Reviewing the project brief…" },
  { keys: ["activity"], label: "Reviewing recent activity…" },
  { keys: ["projects", "summary"], label: "Reviewing the project context…" },
];

export function determineAssistantActivityStatus(content: string): string {
  const needs = inferAssistantContextNeeds(content);
  for (const { keys, label } of activityStatusLabels) {
    if (keys.some((key) => needs[key])) return label;
  }
  return "Preparing your response…";
}
