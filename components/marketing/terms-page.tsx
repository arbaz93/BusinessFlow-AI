"use client";

import { cn } from "@/lib/utils";

const lastUpdated = "January 2025";

const sections = [
  {
    title: "Acceptance of Terms",
    content: `
      <p>By accessing or using BusinessFlow AI ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.</p>
    `,
  },
  {
    title: "Description of Service",
    content: `
      <p>BusinessFlow AI is a business operations workspace for agencies and small service businesses. It provides tools for lead management, client relationships, project organization, briefs, task management, AI-assisted project analysis, and workspace collaboration.</p>
      <p>The Service is provided "as is" and "as available" without warranties of any kind.</p>
    `,
  },
  {
    title: "Accounts & Workspaces",
    content: `
      <ul className="mt-4 space-y-2 list-disc list-inside">
        <li>You must provide accurate information when creating an account.</li>
        <li>You are responsible for maintaining the security of your account credentials.</li>
        <li>Each account belongs to a workspace (organization). Workspace owners control membership and data access.</li>
        <li>You may not share accounts or transfer workspace ownership without proper authorization.</li>
      </ul>
    `,
  },
  {
    title: "Your Data",
    content: `
      <ul className="mt-4 space-y-2 list-disc list-inside">
        <li>You retain ownership of all data you create in BusinessFlow AI (leads, clients, projects, briefs, tasks, documents).</li>
        <li>We do not claim ownership of your content.</li>
        <li>You grant us a license to store, process, and display your data solely to provide the Service.</li>
        <li>You are responsible for ensuring your data complies with applicable laws.</li>
      </ul>
    `,
  },
  {
    title: "AI Features",
    content: `
      <ul className="mt-4 space-y-2 list-disc list-inside">
        <li>AI Project Intelligence uses Google's Gemini API to analyze project content you explicitly submit.</li>
        <li>AI suggestions require human approval before becoming actionable work.</li>
        <li>AI output is provided for assistance only; you are responsible for reviewing and validating all AI-generated content.</li>
        <li>We do not guarantee the accuracy, completeness, or suitability of AI-generated suggestions.</li>
      </ul>
    `,
  },
  {
    title: "Acceptable Use",
    content: `
      <p>You agree not to:</p>
      <ul className="mt-4 space-y-2 list-disc list-inside">
        <li>Use the Service for illegal activities or to violate any laws.</li>
        <li>Attempt to gain unauthorized access to any portion of the Service or other users' data.</li>
        <li>Interfere with the Service's operation or security measures.</li>
        <li>Use the Service to store or transmit malicious code, spam, or harmful content.</li>
        <li>Reverse engineer, decompile, or attempt to extract source code from the Service.</li>
      </ul>
    `,
  },
  {
    title: "Intellectual Property",
    content: `
      <p>BusinessFlow AI, its branding, interface, and underlying technology are owned by us and protected by intellectual property laws. These Terms do not grant you any rights to our trademarks, logos, or proprietary technology.</p>
    `,
  },
  {
    title: "Disclaimers",
    content: `
      <p><strong>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</strong></p>
      <p className="mt-4">We do not warrant that the Service will be uninterrupted, error-free, or free from vulnerabilities. We do not warrant the accuracy or reliability of AI-generated content.</p>
    `,
  },
  {
    title: "Limitation of Liability",
    content: `
      <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES, ARISING FROM OR RELATED TO YOUR USE OF THE SERVICE.</p>
      <p className="mt-4">Our total liability for any claim arising from these Terms shall not exceed the amount you paid for the Service in the 12 months preceding the claim, or $100 if no payment was made.</p>
    `,
  },
  {
    title: "Termination",
    content: `
      <ul className="mt-4 space-y-2 list-disc list-inside">
        <li>You may terminate your account at any time through the application settings.</li>
        <li>We may suspend or terminate access for violations of these Terms.</li>
        <li>Upon termination, your data will be deleted per our data retention policy.</li>
        <li>Sections on data ownership, disclaimers, and limitation of liability survive termination.</li>
      </ul>
    `,
  },
  {
    title: "Changes to Terms",
    content: `
      <p>We may modify these Terms as the Service evolves. Material changes will be communicated via email or in-app notification at least 30 days before taking effect. Continued use after changes constitutes acceptance.</p>
    `,
  },
  {
    title: "Governing Law",
    content: `
      <p>These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict of law principles. Disputes will be resolved in the state or federal courts of Delaware.</p>
    `,
  },
  {
    title: "Contact",
    content: `
      <p>Questions about these Terms? Contact us at <a href="mailto:legal@businessflow.ai" className="text-[var(--accent)] underline">legal@businessflow.ai</a>.</p>
    `,
  },
];

export function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] flex flex-col">
      <section className="py-20 lg:py-28 px-6 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--foreground)]">
            Terms of Service
          </h1>
          <p className="mt-4 text-lg text-[var(--muted)]">Last updated: {lastUpdated}</p>
        </div>
      </section>

      <section className="flex-1 py-16 lg:py-24 px-6 lg:px-10">
        <div className="mx-auto max-w-3xl space-y-16">
          {sections.map((section, index) => (
            <article key={index} className="prose prose-invert max-w-none">
              <h2 className="text-2xl font-semibold text-[var(--foreground)]">{section.title}</h2>
              <div className="mt-4 text-[var(--muted)] leading-8" dangerouslySetInnerHTML={{ __html: section.content }} />
            </article>
          ))}
        </div>
      </section>

      <section className="py-16 px-6 lg:px-10 bg-[var(--surface)] border-y border-[var(--line)]">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[var(--muted)]">
            These Terms reflect the current state of BusinessFlow AI. As the product evolves, terms will be updated to reflect actual capabilities and practices.
          </p>
        </div>
      </section>
    </main>
  );
}