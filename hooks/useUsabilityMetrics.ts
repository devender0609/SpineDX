"use client";
import { useRef, useState } from "react";
import { recordMetrics, BLANK_FEEDBACK } from "@/lib/draftStorage";
import type { FeedbackResponses } from "@/lib/draftStorage";

/** Counts and timings only. Nothing here licenses a time-saving claim. */
export function useUsabilityMetrics() {
  const startedAt = useRef<string>(new Date().toISOString());
  const editCount = useRef(0);
  const modeSwitches = useRef(0);
  const [feedback, setFeedback] = useState<FeedbackResponses>(BLANK_FEEDBACK);
  const [submitted, setSubmitted] = useState(false);

  const record = (args: {
    generatedAt: string | null; mode: "rapid" | "comprehensive";
    confirmationsAnswered: number; blockingAlerts: number; importantAlerts: number;
    responses?: FeedbackResponses;
  }) => {
    recordMetrics({
      startedAt: startedAt.current, generatedAt: args.generatedAt,
      elapsedSeconds: args.generatedAt ? Math.round((Date.parse(args.generatedAt) - Date.parse(startedAt.current)) / 1000) : null,
      mode: args.mode, fieldEdits: editCount.current, confirmationsAnswered: args.confirmationsAnswered,
      modeSwitches: modeSwitches.current, blockingAlerts: args.blockingAlerts,
      importantAlerts: args.importantAlerts, ...(args.responses ?? BLANK_FEEDBACK),
    });
  };
  const reset = () => { startedAt.current = new Date().toISOString(); editCount.current = 0; setFeedback(BLANK_FEEDBACK); setSubmitted(false); };
  return { startedAt, editCount, modeSwitches, feedback, setFeedback, submitted, setSubmitted, record, reset };
}
