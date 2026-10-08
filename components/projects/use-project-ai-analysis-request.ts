"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ProjectAIAnalysisState } from "@/lib/project-ai/persistence";

export function useProjectAIAnalysisRequest({
  projectId,
  routePath,
  status,
}: {
  projectId: string;
  routePath: string;
  status: ProjectAIAnalysisState["status"];
}) {
  const [isPending, setIsPending] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (status !== "PROCESSING") return;

    const intervalId = window.setInterval(() => router.refresh(), 3000);
    return () => window.clearInterval(intervalId);
  }, [router, status]);

  async function startAnalysis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    setIsPending(true);
    setRequestError(null);
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/ai-analysis`, {
        method: "POST",
      });
      if (!response.ok) {
        const payload: unknown = await response.json();
        const errorMessage =
          typeof payload === "object" &&
          payload !== null &&
          "errorMessage" in payload &&
          typeof payload.errorMessage === "string"
            ? payload.errorMessage
            : "AI project intelligence is temporarily unavailable. Please try again.";
        throw new Error(errorMessage);
      }

      if (window.location.pathname === routePath) {
        router.refresh();
      }
    } catch (error) {
      setRequestError(error instanceof Error
        ? error.message
        : "AI project intelligence is temporarily unavailable. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return {
    isPending,
    isProcessing: isPending || status === "PROCESSING",
    requestError,
    startAnalysis,
  };
}
