import type { AssistantProjectSummary } from "@/lib/assistant/context/types";

export type ProjectReferenceMatch =
  | { kind: "none" }
  | { kind: "single"; project: AssistantProjectSummary }
  | { kind: "ambiguous"; candidates: AssistantProjectSummary[] };

function normalize(value: string): string {
  return value.toLowerCase();
}

function charIsWord(char: string | undefined): boolean {
  if (char === undefined) return false;
  return /[a-z0-9]/.test(char);
}

export function containsWord(haystack: string, token: string): boolean {
  if (!token) return false;
  const hay = normalize(haystack);
  const tok = normalize(token).trim();
  if (!tok) return false;
  let from = 0;
  for (;;) {
    const index = hay.indexOf(tok, from);
    if (index < 0) return false;
    const beforeOk = index === 0 || !charIsWord(hay[index - 1]);
    const afterIndex = index + tok.length;
    const afterOk = afterIndex >= hay.length || !charIsWord(hay[afterIndex]);
    if (beforeOk && afterOk) return true;
    from = index + 1;
  }
}

export function projectLabel(project: AssistantProjectSummary): string {
  const qualifier = project.clientCompany || project.clientName;
  return qualifier ? `${qualifier} — ${project.name}` : project.name;
}

export function clientQualifier(project: AssistantProjectSummary): string {
  return project.clientCompany || project.clientName;
}

function projectMatches(project: AssistantProjectSummary, reference: string): boolean {
  if (project.name.length >= 3 && containsWord(reference, project.name)) return true;
  const label = projectLabel(project);
  if (label !== project.name && label.length >= 3 && containsWord(reference, label)) return true;
  return false;
}

export function matchProjectReferences(
  summaries: AssistantProjectSummary[],
  reference: string,
): ProjectReferenceMatch {
  if (!reference || !reference.trim()) return { kind: "none" };

  const matched: AssistantProjectSummary[] = [];
  const seen = new Set<string>();
  for (const project of summaries) {
    if (seen.has(project.projectId)) continue;
    if (projectMatches(project, reference)) {
      seen.add(project.projectId);
      matched.push(project);
    }
  }

  if (matched.length === 0) return { kind: "none" };
  if (matched.length === 1) return { kind: "single", project: matched[0] };
  return { kind: "ambiguous", candidates: matched };
}
