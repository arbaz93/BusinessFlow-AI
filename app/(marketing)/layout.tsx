import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export const metadata: Metadata = {
  title: {
    default: "BusinessFlow AI — Connected Operations for Agencies",
    template: "%s | BusinessFlow AI",
  },
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

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <MarketingHeader />

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <MarketingFooter />
    </div>
  );
}