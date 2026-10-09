"use client";

import Link from "next/link";
import { Sparkle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const footerNavigation = {
  product: [
    { name: "Features", href: "/features" },
    { name: "How It Works", href: "/how-it-works" },
  ],
  solutions: [
    { name: "Use Cases", href: "/solutions" },
    { name: "Security", href: "/security" },
  ],
  legal: [
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
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
              <span className="grid size-9 place-items-center rounded-lg bg-foreground text-sm font-bold text-background"><Sparkle /></span>
              <span className="text-base font-semibold tracking-tight text-[var(--foreground)]">
                BusinessFlow <span className="text-[var(--accent)]">AI</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              Business operations, organized around the work that actually gets done.
            </p>
          </div>

          <nav aria-label="Product">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]">Product</h3>
            <ul className="mt-4 space-y-3" role="list">
              {footerNavigation.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Solutions">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]">Solutions</h3>
            <ul className="mt-4 space-y-3" role="list">
              {footerNavigation.solutions.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]">Legal</h3>
            <ul className="mt-4 space-y-3" role="list">
              {footerNavigation.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-[var(--line)] pt-8 lg:flex-row">
          <p className="text-sm text-[var(--muted-foreground)]">
            &copy; {currentYear} BusinessFlow AI. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "border-[var(--line)] bg-transparent hover:bg-[var(--surface)]"
              )}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ variant: "primary", size: "sm" }),
                "bg-[var(--accent)] text-white hover:opacity-80"
              )}
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}