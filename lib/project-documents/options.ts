export const projectDocumentTypeValues = [
  "PROJECT_BRIEF",
  "CLIENT_ASSET",
  "REFERENCE",
  "DESIGN",
  "DELIVERABLE",
  "OTHER",
] as const;

export type ProjectDocumentType = (typeof projectDocumentTypeValues)[number];

export const projectDocumentTypeLabels: Record<ProjectDocumentType, string> = {
  PROJECT_BRIEF: "Project Brief",
  CLIENT_ASSET: "Client Asset",
  REFERENCE: "Reference",
  DESIGN: "Design",
  DELIVERABLE: "Deliverable",
  OTHER: "Other",
};

export const projectDocumentTypeTone: Record<ProjectDocumentType, string> = {
  PROJECT_BRIEF: "border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent-muted)]",
  CLIENT_ASSET: "border-[var(--info)]/25 bg-[var(--info-surface)] text-[var(--info-line)]",
  REFERENCE: "border-[var(--success)]/25 bg-[var(--success-surface)] text-[var(--success-line)]",
  DESIGN: "border-[var(--warning)]/25 bg-[var(--warning-surface)] text-[var(--warning-line)]",
  DELIVERABLE: "border-[var(--danger)]/25 bg-[var(--danger-surface)] text-[var(--danger-line)]",
  OTHER: "border-[var(--line)] bg-[var(--panel)] text-[var(--muted)]",
};
