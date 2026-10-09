import { Metadata } from "next";
import { PrivacyPage } from "@/components/marketing/privacy-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "BusinessFlow AI Privacy Policy — how we collect, use, and protect your information.",
  openGraph: {
    title: "Privacy Policy | BusinessFlow AI",
    description: "BusinessFlow AI Privacy Policy — how we collect, use, and protect your information.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPageRoute() {
  return <PrivacyPage />;
}