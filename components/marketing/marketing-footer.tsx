"use client";

import Link from "next/link";
import { Sparkle, Sparkles } from "lucide-react";

const footerLinks = {
  product: [
    { name: "Product", href: "#product" },
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "FAQ", href: "#faq" },
  ],
  account: [
    { name: "Get Started", href: "/signup" },
    { name: "Sign In", href: "/login" },
  ],
  legal: [
    // Only include if routes exist - currently omitted
  ],
};

export function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--line)] bg-[var(--background)] px-6 py-12 lg:px-10 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto_auto_auto]">
          <div className="lg:col-span-1 max-w-xs">
            <Link href="/" className="flex items-center gap-3" aria-label="BusinessFlow AI home">
              <span className="grid size-9 place-items-center rounded-lg bg-white text-sm font-bold text-[var(--background)]"><Sparkle /></span>
              <span className="text-base font-semibold tracking-tight text-[var(--foreground)]">
                BusinessFlow <span className="text-[var(--accent)]">AI</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              Connected operations for agencies and small service businesses.
              From first lead to final delivery — one workspace.
            </p>
          </div>

          <nav aria-label="Product">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]">Product</h3>
            <ul className="mt-4 space-y-3" role="list">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Account">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]">Account</h3>
            <ul className="mt-4 space-y-3" role="list">
              {footerLinks.account.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]">Legal</h3>
            <p className="mt-4 text-sm text-[var(--muted-foreground)]">
              Legal pages coming soon. For inquiries, contact support.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--line)] pt-8 lg:flex-row">
          <p className="text-sm text-[var(--muted-foreground)]">
            &copy; {currentYear} BusinessFlow AI. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--muted-foreground)]">Built with</span>
            <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--accent)]">
              <Sparkles size={14} />
              Next.js
            </span>
            <span className="text-[var(--muted-foreground)]">·</span>
            <span className="text-sm font-medium text-[var(--accent)]">Tailwind CSS</span>
            <span className="text-[var(--muted-foreground)]">·</span>
            <span className="text-sm font-medium text-[var(--accent)]">Supabase</span>
          </div>
        </div>
      </div>
    </footer>
  );
}