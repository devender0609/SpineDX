import type { CaseInput } from "./schema.ts";

const DRAFT_KEY = "spinedx-draft-v1";
const METRICS_KEY = "spinedx-metrics-v1";

export type Draft = { savedAt: string; mode: "rapid" | "comprehensive"; data: CaseInput };

/**
 * Fields that could carry directly identifying information. They are stripped before a draft
 * is written to local storage. This is a prototype safeguard, not a compliance control — the
 * UI states plainly that identifying information must not be entered.
 */
const FREE_TEXT_FIELDS: (keyof CaseInput)[] = ["studyId", "patientGoal"];

export function stripIdentifiers(data: CaseInput): CaseInput {
  const copy = structuredClone(data);
  for (const f of FREE_TEXT_FIELDS) (copy as Record<string, unknown>)[f] = "";
  return copy;
}

export function saveDraft(data: CaseInput, mode: "rapid" | "comprehensive"): string | null {
  if (typeof window === "undefined") return null;
  try {
    const savedAt = new Date().toISOString();
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt, mode, data: stripIdentifiers(data) }));
    return savedAt;
  } catch { return null; }
}

export function loadDraft(): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft;
    return parsed?.data && parsed?.savedAt ? parsed : null;
  } catch { return null; }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(DRAFT_KEY); } catch { /* storage unavailable */ }
}

/**
 * Prototype usability instrumentation. Counts and timings only — no clinical values, no free
 * text, no identifiers. Collected to support a future usability evaluation. Nothing here
 * licenses a time-saving claim: no such claim has been validated.
 */
export type UsabilityMetrics = {
  startedAt: string;
  generatedAt: string | null;
  elapsedSeconds: number | null;
  mode: "rapid" | "comprehensive";
  fieldEdits: number;
  confirmationsAnswered: number;
  modeSwitches: number;
  blockingAlerts: number;
  importantAlerts: number;
  clinicianAgreed: "agreed" | "disagreed" | "not-recorded";
};

export function recordMetrics(m: UsabilityMetrics): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(METRICS_KEY);
    const all = raw ? (JSON.parse(raw) as UsabilityMetrics[]) : [];
    all.push(m);
    window.localStorage.setItem(METRICS_KEY, JSON.stringify(all.slice(-100)));
  } catch { /* storage unavailable */ }
}

export function readMetrics(): UsabilityMetrics[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(METRICS_KEY);
    return raw ? (JSON.parse(raw) as UsabilityMetrics[]) : [];
  } catch { return []; }
}

export const DRAFT_STORAGE_KEY = DRAFT_KEY;
export const METRICS_STORAGE_KEY = METRICS_KEY;
