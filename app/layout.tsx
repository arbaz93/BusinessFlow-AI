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

const themeInitializer = `
  (function() {
    try {
      const storedTheme = window.localStorage.getItem('businessflow-theme');
      const preferredTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      const theme = storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : preferredTheme;
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch (error) {
      document.documentElement.dataset.theme = 'dark';
      document.documentElement.style.colorScheme = 'dark';
    }
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
        {children}
      </body>
    </html>
  );
}
