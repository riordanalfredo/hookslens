import type { HookEntry, TimelineEvent } from "../../../utils/store";
import type { PanelStats } from "../types";

export function formatTime(ts: number) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
}

export function formatRelative(ts: number | null) {
  if (!ts) return "-";
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 2) return "now";
  if (diff < 60) return `${diff}s ago`;
  return `${Math.floor(diff / 60)}m ago`;
}

export function durationClass(duration: number | null) {
  if (duration == null) return "";
  if (duration < 150) return "fast";
  if (duration < 500) return "med";
  return "slow";
}

export function getPanelStats(
  hooks: HookEntry[],
  timeline: TimelineEvent[],
): PanelStats {
  return {
    pollingCount: hooks.filter((h) => h.refreshInterval !== null).length,
    errorCount: hooks.filter((h) => h.status === "error").length,
    fetchingCount: hooks.filter((h) => h.status === "fetching").length,
    totalInstances: hooks.reduce((sum, h) => sum + h.instances, 0),
    stalledCount: hooks.filter((h) => h.status === "stalled").length,
    duplicateCount: timeline.filter((t) => t.type === "duplicate-fetch").length,
    mismatchCount: timeline.filter((t) => t.type === "param-mismatch").length,
    badRequestCount: hooks.filter((h) => h.badRequestCount > 0).length,
  };
}
