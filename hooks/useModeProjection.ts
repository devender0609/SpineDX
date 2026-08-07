"use client";
import { useMemo } from "react";
import { projectForMode, suppressedFields } from "@/lib/modeProjection";
import { evaluateCase } from "@/lib/decisionEngine";
import { validateCaseInput } from "@/lib/validation";
import { outstandingRapidRequirements, comprehensiveSuggestions } from "@/lib/rapidRequirements";
import type { CaseInput } from "@/lib/schema";
import type { RapidContext } from "@/lib/rapidRequirements";

/**
 * Single source of truth for what the engine is allowed to see in the active mode.
 * Rapid mode receives an allowlist projection, so hidden Comprehensive answers cannot
 * influence a rapid conclusion while remaining preserved for audit.
 */
export function useModeProjection(data: CaseInput, activeMode: "rapid" | "comprehensive", rapidContext: RapidContext) {
  const engineInput = useMemo(() => projectForMode(data, activeMode), [data, activeMode]);
  const issues = useMemo(() => validateCaseInput(engineInput), [engineInput]);
  const suppressed = useMemo(() => suppressedFields(data, activeMode), [data, activeMode]);
  const liveSafety = useMemo(() => evaluateCase(engineInput), [engineInput]);
  const outstanding = useMemo(() => outstandingRapidRequirements(engineInput, rapidContext), [engineInput, rapidContext]);
  const suggestions = useMemo(() => comprehensiveSuggestions(engineInput), [engineInput]);
  return { engineInput, issues, suppressed, liveSafety, outstanding, suggestions };
}
