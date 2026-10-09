import { Metadata } from "next";
import { HowItWorksPage } from "@/components/marketing/how-it-works-page";

export const metadata: Metadata = {
  title: "How It Works",
  description: "Learn how BusinessFlow AI connects leads, clients, projects, briefs, AI intelligence, and tasks into one connected workflow.",
  openGraph: {
    title: "How It Works | BusinessFlow AI",
    description: "Learn how BusinessFlow AI connects leads, clients, projects, briefs, AI intelligence, and tasks into one connected workflow.",
    type: "website",
  },
};

export default function HowItWorksPageRoute() {
  return <HowItWorksPage />;
}