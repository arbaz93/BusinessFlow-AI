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
  PROJECT_BRIEF: "border-[#8b5cf6]/30 bg-[#8b5cf6]/10 text-[#c4b5fd]",
  CLIENT_ASSET: "border-[#93c5fd]/25 bg-[#93c5fd]/10 text-[#bfdbfe]",
  REFERENCE: "border-[#34d399]/25 bg-[#34d399]/10 text-[#a7f3d0]",
  DESIGN: "border-[#f59e0b]/25 bg-[#f59e0b]/10 text-[#fbbf24]",
  DELIVERABLE: "border-[#f472b6]/25 bg-[#f472b6]/10 text-[#fbcfe8]",
  OTHER: "border-white/10 bg-white/[0.04] text-white/70",
};
