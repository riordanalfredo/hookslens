import type { HookEntry, TimelineEvent } from "../../utils/store";

export type ThemeMode = "dark" | "light";

export interface StoreSnapshot {
  hooks: HookEntry[];
  timeline: TimelineEvent[];
  routes: string[];
  meta: { timestamp: number };
}

export interface PanelStats {
  pollingCount: number;
  errorCount: number;
  fetchingCount: number;
  totalInstances: number;
  stalledCount: number;
  duplicateCount: number;
  mismatchCount: number;
  badRequestCount: number;
}
