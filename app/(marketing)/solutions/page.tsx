import { Metadata } from "next";
import { SolutionsPage } from "@/components/marketing/solutions-page";

export const metadata: Metadata = {
  title: "Solutions",
  description: "See how BusinessFlow AI helps digital agencies, freelancers, small service businesses, and consultants organize client work.",
  openGraph: {
    title: "Solutions | BusinessFlow AI",
    description: "See how BusinessFlow AI helps digital agencies, freelancers, small service businesses, and consultants organize client work.",
    type: "website",
  },
};

export default function SolutionsPageRoute() {
  return <SolutionsPage />;
}