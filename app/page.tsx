import { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { HeroSection } from "@/components/marketing/hero-section";
import { ProblemSolutionSection } from "@/components/marketing/problem-solution-section";
import { WorkflowSection } from "@/components/marketing/workflow-section";
import { CoreCapabilitiesSection } from "@/components/marketing/core-capabilities-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { UseCasesSection } from "@/components/marketing/use-cases-section";
import { FAQSection } from "@/components/marketing/faq-section";
import { FinalCTASection } from "@/components/marketing/final-cta-section";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

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
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <MarketingHeader />

      <div id="main-content" className="flex-1">
        <HeroSection />
        <ProblemSolutionSection />
        <WorkflowSection />
        <CoreCapabilitiesSection />
        <HowItWorksSection />
        <UseCasesSection />
        <FAQSection />
        <FinalCTASection />
      </div>

      <MarketingFooter />
    </main>
  );
}