import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "intervu:saved-jobs";

function readSavedIds(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as number[]) : []);
  } catch {
    return new Set();
  }
}

// Bookmarking has no backend model (no saved_jobs table) — this persists
// entirely client-side in localStorage rather than faking a server-synced
// feature that doesn't exist.
export function useSavedJobs() {
  const [savedIds, setSavedIds] = useState<Set<number>>(() => readSavedIds());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...savedIds]));
  }, [savedIds]);

  const toggle = useCallback((jobId: number) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }, []);

  const isSaved = useCallback((jobId: number) => savedIds.has(jobId), [savedIds]);

  return { isSaved, toggle };
}
