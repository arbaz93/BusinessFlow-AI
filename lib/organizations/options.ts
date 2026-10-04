export const businessTypeValues = [
  "CREATIVE_AGENCY",
  "MARKETING_AGENCY",
  "DESIGN_STUDIO",
  "SOFTWARE_DEVELOPMENT",
  "CONSULTING",
  "OTHER",
] as const;

export type BusinessType = (typeof businessTypeValues)[number];

export const businessTypeLabels: Record<BusinessType, string> = {
  CREATIVE_AGENCY: "Creative agency",
  MARKETING_AGENCY: "Marketing agency",
  DESIGN_STUDIO: "Design studio",
  SOFTWARE_DEVELOPMENT: "Software development",
  CONSULTING: "Consulting",
  OTHER: "Other",
};
