import type { DecisionOutput } from "./decisionEngine.ts";
import type { ValidationIssue } from "./validation.ts";

export type AlertTier = "blocking" | "important" | "advisory";
export type AlertAction = "Review" | "Edit" | "Confirm" | "Switch to Comprehensive";

export type PriorityAlert = {
  id: string;
  tier: AlertTier;
  title: string;
  detail: string;
  action: AlertAction;
  /** Validation domain to jump to, when the alert originates from a field. */
  field?: string;
  domain?: ValidationIssue["domain"];
};

/**
 * Validation issue IDs that belong in the physician-facing Do-not-miss list.
 * Everything else is research- or data-quality noise and stays in the data-quality panel.
 * This is an allowlist so that adding a new low-value validator cannot leak into the
 * clinician's highest-attention surface.
 */
const CLINICAL_ISSUE_TIERS: Record<string, { tier: AlertTier; action: AlertAction }> = {
  "safety-incomplete":                { tier: "blocking",  action: "Review" },
  "scope-unconfirmed":                { tier: "blocking",  action: "Confirm" },
  "scope-outside":                    { tier: "blocking",  action: "Review" },
  "emergency-elective-conflict":      { tier: "blocking",  action: "Review" },
  "trajectory-safety-conflict":       { tier: "blocking",  action: "Review" },
  "surgery-history-conflict":         { tier: "blocking",  action: "Edit" },
  "fusion-level-missing":             { tier: "blocking",  action: "Edit" },
  "progression-conflict":             { tier: "important", action: "Review" },
  "progression-normal-motor":         { tier: "important", action: "Confirm" },
  "motor-reliability-missing":        { tier: "important", action: "Confirm" },
  "side-mismatch-right":              { tier: "important", action: "Review" },
  "side-mismatch-left":               { tier: "important", action: "Review" },
  "injection-level-imaging-mismatch": { tier: "important", action: "Review" },
  "injection-side-symptom-mismatch":  { tier: "important", action: "Review" },
  "images-not-reviewed-details":      { tier: "important", action: "Confirm" },
  "imaging-source-conflict":          { tier: "important", action: "Confirm" },
  "bone-health-unassessed":           { tier: "advisory",  action: "Switch to Comprehensive" },
  "rapid-imaging-detail-missing":     { tier: "advisory",  action: "Edit" },
  "pseudarthrosis-nonfusion":         { tier: "advisory",  action: "Confirm" },
};

/** Proposed-level-without-imaging issues are generated per level, so they are matched by prefix. */
const isProposedLevelIssue = (id: string) => /^proposed-level-.*-imaging-missing$/.test(id);

const TIER_ORDER: Record<AlertTier, number> = { blocking: 0, important: 1, advisory: 2 };

/**
 * Build the physician-facing Do-not-miss list.
 *
 * Deliberately capped. A do-not-miss section that lists twenty items is not a do-not-miss
 * section — it is a backlog, and clinicians stop reading it. Low-value research and
 * data-quality warnings remain available in the full data-quality panel.
 */
export function buildPriorityAlerts(
  result: DecisionOutput,
  issues: ValidationIssue[],
  mode: "rapid" | "comprehensive",
  maxItems = 6,
): PriorityAlert[] {
  const alerts: PriorityAlert[] = [];

  // --- engine-derived clinical conflicts ------------------------------------------------
  if (result.urgency === "emergency") {
    alerts.push({ id: "urgency-emergency", tier: "blocking", action: "Review",
      title: "Emergency warning feature recorded", detail: result.urgencyReason, domain: "safety" });
  } else if (result.urgency === "indeterminate") {
    alerts.push({ id: "urgency-indeterminate", tier: "blocking", action: "Review",
      title: "Urgency unresolved", detail: result.urgencyReason, domain: "safety" });
  } else if (result.urgency === "urgent") {
    alerts.push({ id: "urgency-urgent", tier: "important", action: "Review",
      title: "Expedited assessment supported", detail: result.urgencyReason, domain: "safety" });
  }

  if ((result.neurologic.severity === "severe" || result.neurologic.severity === "moderate") &&
      (result.neurologic.reliability === "low" || result.neurologic.reliability === "indeterminate")) {
    alerts.push({ id: "severe-deficit-low-reliability", tier: "important", action: "Confirm",
      title: "Objective deficit with limited examination reliability",
      detail: "A moderate or severe deficit is recorded while examination reliability is low or undocumented. Confirm reproducibility before this finding is relied on.",
      domain: "examination", field: "examConfidence" });
  }

  if (result.applicability.treatment === "out-of-scope") {
    alerts.push({ id: "out-of-scope", tier: "blocking", action: "Review",
      title: "Case is outside the current lumbar module",
      detail: `Localization and treatment output is withheld: ${result.applicability.reasons.join("; ")}.`,
      domain: "orientation" });
  }

  for (const note of result.scopeNotes) {
    if (note.includes("outside the current")) {
      alerts.push({ id: `scope-${alerts.length}`, tier: "important", action: "Review",
        title: "Documented finding outside the reconciled scope", detail: note, domain: "imaging" });
    }
  }

  if (result.mimics.length) {
    alerts.push({ id: "competing-explanation", tier: "important", action: "Review",
      title: "Competing explanation recorded", detail: result.mimics.join("; "),
      domain: "examination" });
  }

  if (result.fusion.status === "incompletely-assessed") {
    alerts.push({ id: "fusion-incomplete", tier: "important",
      action: mode === "rapid" ? "Switch to Comprehensive" : "Edit",
      title: "Fusion considered without level-specific evaluation",
      detail: `Fusion assessment incomplete. Missing: ${result.fusion.missing.join(", ") || "level-specific factors"}.`,
      domain: "treatment" });
  }

  // --- validation-derived conflicts -----------------------------------------------------
  for (const issue of issues) {
    const mapped = CLINICAL_ISSUE_TIERS[issue.id]
      ?? (isProposedLevelIssue(issue.id) ? { tier: "blocking" as AlertTier, action: "Edit" as AlertAction } : undefined);
    if (!mapped) continue;
    alerts.push({ id: issue.id, tier: mapped.tier, action: mapped.action,
      title: issue.title, detail: issue.message, field: issue.field, domain: issue.domain });
  }

  // De-duplicate by title, then sort by tier and cap.
  const seen = new Set<string>();
  return alerts
    .filter(a => (seen.has(a.title) ? false : (seen.add(a.title), true)))
    .sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier])
    .slice(0, maxItems);
}
