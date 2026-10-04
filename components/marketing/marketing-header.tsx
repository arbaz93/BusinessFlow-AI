"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Sparkle, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Product", href: "#product" },
  { name: "How It Works", href: "#how-it-works" },
  { name: "Features", href: "#features" },
  { name: "FAQ", href: "#faq" },
];

export function MarketingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-[var(--line)] bg-[var(--background)]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="BusinessFlow AI home">
          <span className="grid size-9 place-items-center rounded-lg bg-white text-sm font-bold text-[var(--background)]"><Sparkle /></span>
          <span className="text-base font-semibold tracking-tight text-[var(--foreground)]">
            BusinessFlow <span className="text-[var(--accent)]">AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-[var(--muted)] lg:flex" aria-label="Main navigation">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="transition-colors hover:text-[var(--foreground)]"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 text-sm font-medium">
          <Link
            href="/login"
            className="text-[var(--muted)] transition-colors hover:text-[var(--foreground)] hidden sm:inline-block"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "hidden sm:inline-flex"
            )}
          >
            Get Started
          </Link>

          <button
            type="button"
            className="lg:hidden p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={cn(
          "lg:hidden border-t border-[var(--line)] bg-[var(--background)] transition-opacity duration-200",
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="px-6 py-4 space-y-3">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="block py-2 text-base font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-[var(--line)] flex flex-col gap-3">
            <Link
              href="/login"
              className="text-center text-base font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className={cn(buttonVariants({ variant: "default", size: "default" }), "text-center")}
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}