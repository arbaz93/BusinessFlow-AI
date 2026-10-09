"use client";

const lastUpdated = "January 2025";

const sections = [
  {
    title: "Information We Collect",
    content: `
      <p>We collect information you provide directly to us when you create an account, set up a workspace, and use BusinessFlow AI.</p>
      <ul className="mt-4 space-y-2 list-disc list-inside">
        <li><strong>Account information:</strong> Name, email address, and authentication credentials (handled by Supabase Auth).</li>
        <li><strong>Workspace data:</strong> Organization name, business type, and workspace settings.</li>
        <li><strong>Operational data:</strong> Leads, clients, projects, briefs, tasks, documents, and activity you create in the workspace.</li>
        <li><strong>AI interaction data:</strong> Briefs and documents you submit for AI analysis, and the AI-generated responses.</li>
        <li><strong>Usage data:</strong> Interaction with the application for product improvement and debugging.</li>
      </ul>
    `,
  },
  {
    title: "How We Use Your Information",
    content: `
      <ul className="mt-4 space-y-2 list-disc list-inside">
        <li>Provide and maintain the BusinessFlow AI service</li>
        <li>Process authentication and authorize access to your workspace</li>
        <li>Enable AI Project Intelligence features using your project context</li>
        <li>Send service-related communications (security updates, account changes)</li>
        <li>Improve product functionality and fix issues</li>
        <li>Comply with legal obligations</li>
      </ul>
    `,
  },
  {
    title: "Data Storage & Security",
    content: `
      <ul className="mt-4 space-y-2 list-disc list-inside">
        <li><strong>Database:</strong> PostgreSQL hosted on Supabase with row-level security enforcing workspace isolation.</li>
        <li><strong>Documents:</strong> Private Supabase storage buckets with signed, time-limited URLs.</li>
        <li><strong>Authentication:</strong> Supabase Auth with email confirmation, secure password reset, and HttpOnly session cookies.</li>
        <li><strong>AI processing:</strong> Project context sent to Google Gemini API for analysis; data not used for model training.</li>
        <li><strong>Encryption:</strong> TLS in transit; encryption at rest provided by Supabase infrastructure.</li>
      </ul>
    `,
  },
  {
    title: "AI Data Processing",
    content: `
      <p>When you use AI Project Intelligence, your project briefs and documents are sent to Google's Gemini API for analysis.</p>
      <ul className="mt-4 space-y-2 list-disc list-inside">
        <li>Only the specific project content you choose to analyze is sent.</li>
        <li>No workspace-wide data, other projects, or authentication credentials are shared.</li>
        <li>Google's API terms apply; data is not used to train Google's models.</li>
        <li>You control when AI analysis runs — it is not automatic.</li>
      </ul>
    `,
  },
  {
    title: "Data Retention",
    content: `
      <ul className="mt-4 space-y-2 list-disc list-inside">
        <li>Account and workspace data retained while your account is active.</li>
        <li>Deleted workspaces: data removed within 30 days of deletion request.</li>
        <li>Authentication logs retained per Supabase retention policies.</li>
        <li>AI interaction logs retained for debugging and product improvement (maximum 90 days).</li>
      </ul>
    `,
  },
  {
    title: "Your Rights",
    content: `
      <ul className="mt-4 space-y-2 list-disc list-inside">
        <li>Access and export your workspace data.</li>
        <li>Request deletion of your account and all associated data.</li>
        <li>Update your profile and notification preferences.</li>
        <li>Revoke AI analysis permissions per project.</li>
      </ul>
      <p className="mt-4">To exercise these rights, use the account settings in the application or contact support.</p>
    `,
  },
  {
    title: "Third-Party Services",
    content: `
      <p>BusinessFlow AI uses the following third-party services:</p>
      <ul className="mt-4 space-y-2 list-disc list-inside">
        <li><strong>Supabase:</strong> Database, authentication, storage, and edge functions.</li>
        <li><strong>Google Gemini API:</strong> AI Project Intelligence analysis.</li>
        <li><strong>Vercel:</strong> Hosting and edge network.</li>
      </ul>
      <p className="mt-4">Each provider has its own privacy policy governing their processing of data.</p>
    `,
  },
  {
    title: "Changes to This Policy",
    content: `
      <p>We may update this Privacy Policy as the product evolves. Material changes will be communicated via email or in-app notification. The "Last updated" date at the top of this page reflects the most recent revision.</p>
    `,
  },
  {
    title: "Contact",
    content: `
      <p>Questions about this Privacy Policy or your data? Contact us at <a href="mailto:privacy@businessflow.ai" className="text-[var(--accent)] underline">privacy@businessflow.ai</a>.</p>
    `,
  },
];

export function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] flex flex-col">
      <section className="py-20 lg:py-28 px-6 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--foreground)]">
            Privacy Policy
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
            This Privacy Policy is a living document. As BusinessFlow AI adds features, this policy will be updated to reflect actual data practices.
          </p>
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            For the most current version, visit this page or check the in-app settings.
          </p>
        </div>
      </section>
    </main>
  );
}