"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, Sparkle, X } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Product", href: "/features" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "Solutions", href: "/solutions" },
  { name: "Security", href: "/security" },
];

const navLinkClassName = "transition-colors hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";
const navLinkActiveClassName = "text-[var(--foreground)] font-medium";
const mobileNavLinkClassName = "block py-2 text-base font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] rounded-md px-2 py-1";
const mobileNavLinkActiveClassName = "text-[var(--accent)] font-medium";
const signInLinkClassName = "text-[var(--muted)] transition-colors hover:text-[var(--foreground)] hidden sm:inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] rounded-md px-2 py-1";
const mobileSignInLinkClassName = "text-center text-base font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] rounded-md px-4 py-2";
const mobileGetStartedClassName = "text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";
const menuButtonClassName = "lg:hidden p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";

export function MarketingHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLAnchorElement>(null);
  const lastFocusableRef = useRef<HTMLAnchorElement>(null);

  const isActive = (href: string) => {
    if (href === "/features") return pathname === "/features";
    if (href === "/how-it-works") return pathname === "/how-it-works";
    if (href === "/solutions") return pathname === "/solutions";
    if (href === "/security") return pathname === "/security";
    return false;
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!mobileMenuOpen) return;
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
      if (event.key === "Tab") {
        const focusableElements = mobileMenuRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements?.length) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      const focusableElements = mobileMenuRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      firstFocusableRef.current = focusableElements?.[0] as HTMLAnchorElement ?? null;
      lastFocusableRef.current = focusableElements?.[focusableElements.length - 1] as HTMLAnchorElement ?? null;
      firstFocusableRef.current?.focus();
    }
  }, [mobileMenuOpen]);

  return (
    <header className="border-b border-[var(--line)] bg-[var(--background)]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="BusinessFlow AI home">
          <span className="grid size-9 place-items-center rounded-lg bg-foreground text-sm font-bold text-background"><Sparkle /></span>
          <span className="text-base font-semibold tracking-tight text-[var(--foreground)]">
            BusinessFlow <span className="text-[var(--accent)]">AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-[var(--muted)] lg:flex" aria-label="Main navigation">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(navLinkClassName, active && navLinkActiveClassName)}
                aria-current={active ? "page" : undefined}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 text-sm font-medium">
          <ThemeToggle />

          <Link
            href="/login"
            className={signInLinkClassName}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className={cn(buttonVariants({ variant: "primary", size: "sm" }), "hidden sm:inline-flex")}
          >
            Get Started
          </Link>

          <button
            ref={menuButtonRef}
            type="button"
            className={menuButtonClassName}
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
        ref={mobileMenuRef}
        id="mobile-menu"
        className={cn(
          "lg:hidden border-t border-[var(--line)] bg-[var(--background)] transition-opacity duration-200",
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none hidden"
        )}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="px-6 py-4 space-y-3">
          {navigation.map((item, index) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                ref={index === 0 ? firstFocusableRef : undefined}
                href={item.href}
                className={cn(mobileNavLinkClassName, active && mobileNavLinkActiveClassName)}
                aria-current={active ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            );
          })}
          <div className="pt-4 border-t border-[var(--line)] flex flex-col gap-3">
            <Link
              href="/login"
              className={mobileSignInLinkClassName}
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link
              ref={lastFocusableRef}
              href="/signup"
              className={cn(buttonVariants({ variant: "primary", size: "default" }), mobileGetStartedClassName)}
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