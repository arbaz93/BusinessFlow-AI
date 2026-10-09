import { Metadata } from "next";
import { SecurityPage } from "@/components/marketing/security-page";

export const metadata: Metadata = {
  title: "Security",
  description: "Learn about BusinessFlow AI's security architecture — workspace isolation, server-side authorization, private documents, AI boundaries, and human approval controls.",
  openGraph: {
    title: "Security | BusinessFlow AI",
    description: "Learn about BusinessFlow AI's security architecture — workspace isolation, server-side authorization, private documents, AI boundaries, and human approval controls.",
    type: "website",
  },
};

export default function SecurityPageRoute() {
  return <SecurityPage />;
}