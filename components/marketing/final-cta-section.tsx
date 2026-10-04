"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FinalCTASection() {
  return (
    <section className="relative py-20 lg:py-28 px-6 lg:px-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent)]/5 via-transparent to-transparent" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl text-center">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--foreground)]">
          Bring your client work into one connected flow.
        </h2>
        <p className="mt-6 text-lg md:text-xl leading-8 text-[var(--muted)]">
          Start with your workspace, organize client relationships, and give every project a clearer place to move forward.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "group"
            )}
          >
            Get Started
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "border-[var(--line)] bg-transparent hover:bg-[var(--surface)]"
            )}
          >
            Sign In
          </Link>
        </div>
        <p className="mt-6 text-sm text-[var(--muted-foreground)]">
          No credit card required. Set up your workspace in minutes.
        </p>
      </div>
    </section>
  );
}