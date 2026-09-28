export const leadSourceValues = [
  "WEBSITE",
  "REFERRAL",
  "LINKEDIN",
  "FIVERR",
  "UPWORK",
  "SOCIAL_MEDIA",
  "COLD_OUTREACH",
  "OTHER",
] as const;

export const leadSourceLabels: Record<(typeof leadSourceValues)[number], string> = {
  WEBSITE: "Website",
  REFERRAL: "Referral",
  LINKEDIN: "LinkedIn",
  FIVERR: "Fiverr",
  UPWORK: "Upwork",
  SOCIAL_MEDIA: "Social Media",
  COLD_OUTREACH: "Cold Outreach",
  OTHER: "Other",
};

export const leadStatusValues = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "WON",
  "LOST",
] as const;

export const leadStatusLabels: Record<(typeof leadStatusValues)[number], string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROPOSAL_SENT: "Proposal Sent",
  WON: "Won",
  LOST: "Lost",
};

export const currencyValues = ["USD", "EUR", "GBP", "CAD", "AUD"] as const;