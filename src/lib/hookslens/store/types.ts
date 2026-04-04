export const SLOW_FETCH_THRESHOLD_MS = 1000;
export const STALL_THRESHOLD_MS = 5000;

export type HookStatus = "fresh" | "fetching" | "stale" | "error" | "stalled";
export type FetchOrigin = "swr" | "effect" | "unknown";
export type FetchMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "unknown";

export interface ParamSnapshot {
  url: string;
  pathname: string;
  queryParams: Record<string, string>;
  bodyParams: Record<string, unknown> | null;
  method: FetchMethod;
  capturedAt: number;
}

export interface ParamMismatch {
  id: string;
  endpoint: string;
  seenParamSets: string[][];
  firstSeenAt: number;
  lastSeenAt: number;
  occurrences: number;
  exampleUrls: string[];
}

export interface FetchEvent {
  id: string;
  timestamp: number;
  url: string;
  pathname: string;
  method: FetchMethod;
  origin: FetchOrigin;
  route: string;
  status: number | null;
  duration: number | null;
  params: ParamSnapshot;
  swrKey: string | null;
}

export interface RouteCoverage {
  route: string;
  totalFetches: number;
  swrFetches: number;
  effectFetches: number;
  unknownFetches: number;
  duplicateUrls: string[];
  inconsistentUrls: string[];
  coveragePct: number;
}

export interface HookEntry {
  key: string;
  type: "query" | "mutation";
  status: HookStatus;
  instances: number;
  refreshInterval: number | null;
  lastDuration: number | null;
  lastFetchedAt: number | null;
  fetchStartedAt: number | null;
  errorCount: number;
  slowCount: number;
  routes: string[];
  lastHttpStatus: number | null;
  badRequestCount: number;
  lastUrl: string | null;
  recentParams: ParamSnapshot[];
}

export type TimelineEventType =
  | "fetch"
  | "success"
  | "error"
  | "dedup"
  | "revalidate"
  | "slow"
  | "stalled"
  | "mutation"
  | "mutation-success"
  | "mutation-error"
  | "external-fetch"
  | "external-success"
  | "external-error"
  | "param-mismatch"
  | "duplicate-fetch";

export interface TimelineEvent {
  id: string;
  timestamp: number;
  type: TimelineEventType;
  key: string;
  duration: number | null;
  route: string;
  concurrentWith: string[];
  httpStatus: number | null;
  origin: FetchOrigin;
  flagged: boolean;
}

export interface WaterfallEntry {
  id: string;
  key: string;
  route: string;
  origin: FetchOrigin;
  startedAt: number;
  completedAt: number | null;
  duration: number | null;
  status: "pending" | "success" | "error" | "slow";
  httpStatus: number | null;
  concurrent: string[];
}

export interface CustomHookRegistration {
  name: string;
  description: string | null;
  fetchKey: string | null;
  custom: boolean;
  route: string;
  registeredAt: number;
}
