import type { CaseInput } from "./schema.ts";
import type { AdjudicationRecord } from "./schema.ts";
import type { DecisionOutput } from "./decisionEngine.ts";
import type { ValidationIssue } from "./validation.ts";

/**
 * Fields that can carry a direct or indirect identifier. The structured de-identified export
 * removes every one of them. This list is the single source of truth: the export function and
 * the pre-export review modal both read from it, so the list shown to the user cannot drift
 * from the list actually stripped.
 */
export const IDENTIFIABLE_CASE_FIELDS = ["studyId", "patientGoal"] as const;

export const IDENTIFIABLE_ADJUDICATION_FIELDS = [
  "caseId", "siteCode",
] as const;

export const IDENTIFIABLE_REVIEWER_FIELDS = [
  "reviewerId", "rationale", "disagreementReason", "notes",
] as const;

export type ExportMode = "deidentified" | "full";

export type ExportPayload = {
  exportMode: ExportMode;
  deidentified: boolean;
  generatedAt: string;
  appVersion: string;
  rulesetVersion: string;
  exportSchemaVersion: string;
  workflowMode: "rapid" | "comprehensive";
  assessment: CaseInput | null;
  result: DecisionOutput | null;
  validationIssues: ValidationIssue[];
  adjudication: AdjudicationRecord | null;
  suppressedInRapidMode: string[];
  /** Only present in a full export. */
  fullEnteredCase?: CaseInput;
  removedFields?: string[];
};

const blankReviewer = (r: Record<string, unknown>) => {
  const copy = { ...r };
  for (const f of IDENTIFIABLE_REVIEWER_FIELDS) copy[f] = "";
  return copy;
};

/** Fields that would be removed by a de-identified export, for the pre-export review modal. */
export function identifyingFieldsPresent(
  data: CaseInput,
  adjudication: AdjudicationRecord,
): string[] {
  const present: string[] = [];
  for (const f of IDENTIFIABLE_CASE_FIELDS) {
    if (String(data[f] ?? "").trim()) present.push(`Case: ${f}`);
  }
  for (const f of IDENTIFIABLE_ADJUDICATION_FIELDS) {
    if (String((adjudication as unknown as Record<string, unknown>)[f] ?? "").trim())
      present.push(`Adjudication: ${f}`);
  }
  for (const role of ["firstReviewer", "secondReviewer", "adjudicated"] as const) {
    const r = adjudication[role] as unknown as Record<string, unknown>;
    for (const f of IDENTIFIABLE_REVIEWER_FIELDS) {
      if (String(r?.[f] ?? "").trim()) present.push(`${role}: ${f}`);
    }
  }
  return present;
}

export function buildExport(args: {
  mode: ExportMode;
  snapshot: CaseInput | null;
  fullCase: CaseInput;
  result: DecisionOutput | null;
  issues: ValidationIssue[];
  adjudication: AdjudicationRecord;
  workflowMode: "rapid" | "comprehensive";
  suppressed: string[];
  appVersion: string;
  rulesetVersion: string;
  exportSchemaVersion: string;
}): ExportPayload {
  const base = {
    generatedAt: new Date().toISOString(),
    appVersion: args.appVersion,
    rulesetVersion: args.rulesetVersion,
    exportSchemaVersion: args.exportSchemaVersion,
    workflowMode: args.workflowMode,
    result: args.result,
    validationIssues: args.issues,
    suppressedInRapidMode: args.suppressed,
  };

  if (args.mode === "full") {
    return {
      ...base,
      exportMode: "full",
      deidentified: false,
      assessment: args.snapshot,
      adjudication: args.adjudication,
      fullEnteredCase: args.fullCase,
    };
  }

  // De-identified: strip every designated field from a deep copy. The flag is only set to
  // true on this path, so nothing can be labelled de-identified without being stripped.
  const assessment = args.snapshot ? structuredClone(args.snapshot) : null;
  const removed: string[] = [];
  if (assessment) {
    for (const f of IDENTIFIABLE_CASE_FIELDS) {
      if (String(assessment[f] ?? "").trim()) removed.push(`Case: ${f}`);
      (assessment as unknown as Record<string, unknown>)[f] = "";
    }
  }
  const adj = structuredClone(args.adjudication) as unknown as Record<string, unknown>;
  for (const f of IDENTIFIABLE_ADJUDICATION_FIELDS) {
    if (String(adj[f] ?? "").trim()) removed.push(`Adjudication: ${f}`);
    adj[f] = "";
  }
  for (const role of ["firstReviewer", "secondReviewer", "adjudicated"]) {
    const r = adj[role] as Record<string, unknown> | undefined;
    if (!r) continue;
    for (const f of IDENTIFIABLE_REVIEWER_FIELDS) {
      if (String(r[f] ?? "").trim()) removed.push(`${role}: ${f}`);
    }
    adj[role] = blankReviewer(r);
  }

  return {
    ...base,
    exportMode: "deidentified",
    deidentified: true,
    assessment,
    adjudication: adj as unknown as AdjudicationRecord,
    removedFields: [...new Set(removed)],
    // fullEnteredCase is deliberately absent: it is the unfiltered form state.
  };
}

export const FULL_EXPORT_WARNING =
  "This file may contain identifiers or sensitive clinical information. Store and transmit only within an approved secure research environment.";
