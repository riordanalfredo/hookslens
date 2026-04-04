import type {
  HookEntry,
  ParamMismatch,
  RouteCoverage,
  TimelineEvent,
  WaterfallEntry,
} from "../../utils/store";

export type ThemeMode = "dark" | "light";
export type ViewMode =
  | "current"
  | "all-hooks"
  | "params"
  | "coverage"
  | "waterfall"
  | "polling";

export interface StoreSnapshot {
  hooks: HookEntry[];
  timeline: TimelineEvent[];
  waterfall: WaterfallEntry[];
  routeCoverage: RouteCoverage[];
  diagnostics: DiagnosticSnapshot;
  routes: string[];
  meta: { timestamp: number };
}

export interface DiagnosticSnapshot {
  slowKeys: HookEntry[];
  stalledKeys: HookEntry[];
  highInstanceKeys: HookEntry[];
  paramMismatches: ParamMismatch[];
  badRequestKeys: HookEntry[];
  lowCoverageRoutes: RouteCoverage[];
  duplicateFetchRoutes: RouteCoverage[];
  effectOnlyRoutes: RouteCoverage[];
  pollingKeys: HookEntry[];
  errorKeys: HookEntry[];
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
