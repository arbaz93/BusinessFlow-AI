import { Metadata } from "next";
import { HeroSection } from "@/components/marketing/hero-section";
import { ProblemSolutionSection } from "@/components/marketing/problem-solution-section";
import { WorkflowSection } from "@/components/marketing/workflow-section";
import { CoreCapabilitiesSection } from "@/components/marketing/core-capabilities-section";
import { AIProjectIntelligenceSection } from "@/components/marketing/ai-project-intelligence-section";
import { HumanControlSection } from "@/components/marketing/human-control-section";
import { UseCasesSection } from "@/components/marketing/use-cases-section";
import { SecurityPreviewSection } from "@/components/marketing/security-preview-section";
import { FinalCTASection } from "@/components/marketing/final-cta-section";

export const metadata: Metadata = {
  title: "BusinessFlow AI — Connected Operations for Agencies",
  description:
    "Organize leads, manage client relationships, and connect projects in one workspace built for agencies and small service businesses.",
  openGraph: {
    title: "BusinessFlow AI — Connected Operations for Agencies",
    description:
      "Organize leads, manage client relationships, and connect projects in one workspace built for agencies and small service businesses.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BusinessFlow AI — Connected Operations for Agencies",
    description:
      "Organize leads, manage client relationships, and connect projects in one workspace built for agencies and small service businesses.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)] flex flex-col">
      <HeroSection />
      <ProblemSolutionSection />
      <WorkflowSection />
      <CoreCapabilitiesSection />
      <AIProjectIntelligenceSection />
      <HumanControlSection />
      <UseCasesSection />
      <SecurityPreviewSection />
      <FinalCTASection />
    </main>
  );
}