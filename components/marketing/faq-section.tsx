"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const faqs = [
  {
    question: "What is BusinessFlow AI?",
    answer:
      "BusinessFlow AI is a business operations workspace designed to help agencies and small service businesses connect lead management, client relationships, projects, and project-delivery workflows in one organized workspace.",
  },
  {
    question: "Who is BusinessFlow AI for?",
    answer:
      "It is designed for digital agencies, freelancers, consultants, and small service teams that manage ongoing client work and want a connected workspace from prospect to project delivery.",
  },
  {
    question: "How do Leads and Clients work together?",
    answer:
      "Leads represent potential business opportunities. When a prospect becomes a customer, the lead can be converted into a client while preserving the original sales record and context.",
  },
  {
    question: "Can I connect a project to a client?",
    answer:
      "Yes. Projects are designed to belong to a client, keeping the project and client relationship connected. You can view all projects for a client and see the client context from any project.",
  },
  {
    question: "How does AI Project Intelligence work?",
    answer:
      "AI Project Intelligence is a planned capability. When available, it will analyze project briefs and documents to surface summaries, extract requirements, identify missing information, flag potential risks, and suggest next steps — all with human review before any action is taken.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No. BusinessFlow AI is a web application. You access it through your browser — no installation required.",
  },
  {
    question: "How do I get started?",
    answer: (
      <>
        Create an account, set up your workspace, and start organizing your business operations.
        <Link href="/signup" className="ml-1 font-medium text-[var(--accent)] underline underline-offset-4 hover:text-[var(--accent-muted)]">
          Get started
        </Link>
        .
      </>
    ),
  },
];

function FAQItem({ question, answer }: { question: string; answer: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <details className="group rounded-xl border border-[var(--line)] bg-[var(--panel)] overflow-hidden">
      <summary
        className="flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer list-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
        onClick={(e) => {
          e.preventDefault();
          setOpen(!open);
        }}
        aria-expanded={open}
      >
        <span className="text-lg font-medium text-[var(--foreground)] pr-8">{question}</span>
        <span
          className={cn(
            "shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden="true"
        >
          {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </summary>
      <div
        className={cn(
          "px-6 pb-5 text-base leading-7 text-[var(--muted)] transition-all duration-200",
          open ? "opacity-100 max-h-96" : "opacity-0 max-h-0"
        )}
        role="region"
        aria-label={`Answer to: ${question}`}
      >
        {answer}
      </div>
    </details>
  );
}

export function FAQSection() {
  return (
    <section id="faq" className="py-20 lg:py-28 px-6 lg:px-10 bg-[var(--surface)] border-y border-[var(--line)]">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--foreground)]">
            Frequently asked questions.
          </h2>
          <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
            Quick answers to common questions about BusinessFlow AI.
          </p>
        </div>

        <dl className="mt-12 space-y-4" role="list">
          {faqs.map((faq, index) => (
            <div key={index}>
              <FAQItem question={faq.question} answer={faq.answer} />
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}