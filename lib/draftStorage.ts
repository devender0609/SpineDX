import type { CaseInput } from "./schema.ts";

const DRAFT_KEY = "spinedx-draft-v1";
const OPTIN_KEY = "spinedx-draft-optin-v1";
/** Prototype retention window. Drafts older than this are discarded on read. */
export const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
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

/**
 * Three explicit modes. "session" uses sessionStorage, which the browser clears when the tab
 * closes — the correct primitive for a shared clinical workstation. "local" uses localStorage
 * with a 24-hour expiry. "off" writes nothing at all and is the default.
 */
export type DraftMode = "off" | "session" | "local";

export function draftMode(): DraftMode {
  if (typeof window === "undefined") return "off";
  try {
    const v = window.localStorage.getItem(OPTIN_KEY);
    return v === "local" || v === "session" ? v : "off";
  } catch { return "off"; }
}

export function setDraftMode(mode: DraftMode): void {
  if (typeof window === "undefined") return;
  try {
    if (mode === "off") {
      window.localStorage.removeItem(OPTIN_KEY);
      window.localStorage.removeItem(DRAFT_KEY);
      window.sessionStorage.removeItem(DRAFT_KEY);
    } else {
      window.localStorage.setItem(OPTIN_KEY, mode);
      // switching modes must not leave a copy behind in the other store
      (mode === "local" ? window.sessionStorage : window.localStorage).removeItem(DRAFT_KEY);
    }
  } catch { /* storage unavailable */ }
}

const store = (mode: DraftMode): Storage | null => {
  if (typeof window === "undefined" || mode === "off") return null;
  return mode === "session" ? window.sessionStorage : window.localStorage;
};

/** Retained for call sites that only need to know whether anything is being saved. */
export const draftEnabled = (): boolean => draftMode() !== "off";

export function saveDraft(data: CaseInput, mode: "rapid" | "comprehensive"): string | null {
  const s = store(draftMode());
  if (!s) return null;
  try {
    const savedAt = new Date().toISOString();
    s.setItem(DRAFT_KEY, JSON.stringify({ savedAt, mode, data: stripIdentifiers(data) }));
    return savedAt;
  } catch { return null; }
}

export function loadDraft(): Draft | null {
  const dm = draftMode();
  const s = store(dm);
  if (!s) return null;
  try {
    const raw = s.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft;
    if (!parsed?.data || !parsed?.savedAt) return null;
    // Expire rather than resurrect: a stale draft on a shared workstation is a hazard.
    // Session drafts do not need a timer — the browser clears them when the tab closes.
    if (dm === "local" && Date.now() - Date.parse(parsed.savedAt) > DRAFT_TTL_MS) { clearDraft(); return null; }
    return parsed;
  } catch { return null; }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
    window.sessionStorage.removeItem(DRAFT_KEY);
  } catch { /* storage unavailable */ }
}

/**
 * Prototype usability instrumentation. Counts and timings only — no clinical values, no free
 * text, no identifiers. Collected to support a future usability evaluation. Nothing here
 * licenses a time-saving claim: no such claim has been validated.
 */
export type FeedbackResponses = {
  clinicianAgreed: "agree" | "partly" | "disagree" | "unable" | "not-recorded";
  timeBurden: "saved-time" | "no-difference" | "added-time" | "unable" | "not-recorded";
  clinicalUsefulness: "identified-useful-issue" | "confirmed-known" | "irrelevant-alert" | "no-contribution" | "unable" | "not-recorded";
  communication: "handoff-useful" | "handoff-partly-useful" | "handoff-not-useful" | "not-used" | "not-recorded";
  impact: "changed-urgency" | "changed-localization" | "changed-requested-information" | "changed-treatment-discussion" | "no-change" | "not-assessed";
};

export const BLANK_FEEDBACK: FeedbackResponses = {
  clinicianAgreed: "not-recorded", timeBurden: "not-recorded",
  clinicalUsefulness: "not-recorded", communication: "not-recorded", impact: "not-assessed",
};

export type UsabilityMetrics = FeedbackResponses & {
  startedAt: string;
  generatedAt: string | null;
  elapsedSeconds: number | null;
  mode: "rapid" | "comprehensive";
  fieldEdits: number;
  confirmationsAnswered: number;
  modeSwitches: number;
  blockingAlerts: number;
  importantAlerts: number;
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
