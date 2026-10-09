import { Metadata } from "next";
import { TermsPage } from "@/components/marketing/terms-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "BusinessFlow AI Terms of Service — the agreement governing your use of the service.",
  openGraph: {
    title: "Terms of Service | BusinessFlow AI",
    description: "BusinessFlow AI Terms of Service — the agreement governing your use of the service.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPageRoute() {
  return <TermsPage />;
}