import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
