"use client";
import { useEffect, useState } from "react";
import { saveDraft, loadDraft, clearDraft, draftMode, setDraftMode } from "@/lib/draftStorage";
import type { DraftMode, Draft } from "@/lib/draftStorage";
import type { CaseInput } from "@/lib/schema";

/**
 * Draft persistence. Off until the clinician opts in; a saved draft is never restored
 * without an explicit Resume. All storage rules live in lib/draftStorage.
 */
export function useDraftStorage(data: CaseInput, workflowMode: "rapid" | "comprehensive") {
  const [storageMode, setStorageMode] = useState<DraftMode>("off");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [recoverable, setRecoverable] = useState<{ savedAt: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    const m = draftMode();
    setStorageMode(m);
    if (m !== "off") { const d = loadDraft(); if (d) setRecoverable({ savedAt: d.savedAt }); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { const at = saveDraft(data, workflowMode); if (at) setSavedAt(at); }, 1200);
    return () => clearTimeout(t);
  }, [data, workflowMode]);

  const choose = (mode: DraftMode) => { setDraftMode(mode); setStorageMode(mode); if (mode === "off") setDismissed(true); };
  const discard = () => { clearDraft(); setDraftMode("off"); setStorageMode("off"); setRecoverable(null); setConfirmClear(false); };
  const resume = (): Draft | null => { const d = loadDraft(); setRecoverable(null); return d; };

  return { storageMode, savedAt, recoverable, dismissed, setDismissed, confirmClear, setConfirmClear, choose, discard, resume };
}
