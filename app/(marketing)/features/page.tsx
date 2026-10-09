import { Metadata } from "next";
import { FeaturesPage } from "@/components/marketing/features-page";

export const metadata: Metadata = {
  title: "Features",
  description: "Explore the core capabilities of BusinessFlow AI — lead management, client relationships, projects, briefs, AI intelligence, and connected workspace.",
  openGraph: {
    title: "Features | BusinessFlow AI",
    description: "Explore the core capabilities of BusinessFlow AI — lead management, client relationships, projects, briefs, AI intelligence, and connected workspace.",
    type: "website",
  },
};

export default function FeaturesPageRoute() {
  return <FeaturesPage />;
}