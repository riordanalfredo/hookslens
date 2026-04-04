// ─────────────────────────────────────────────────────────────────────────────
// hookslens — store.ts  v0.3
//
// Three goals this store serves:
//  1. Performance debugging   — slow/stalled hooks, duplicate fetches, render cost
//  2. Param bug detection     — wrong/shifting URL params, 4xx response tracking
//  3. Fetch practice auditing — SWR vs useEffect vs SSR inconsistency per route
// ─────────────────────────────────────────────────────────────────────────────

export const SLOW_FETCH_THRESHOLD_MS = 1000;
export const STALL_THRESHOLD_MS = 5000;

// ─── Core types ──────────────────────────────────────────────────────────────

export type HookStatus = "fresh" | "fetching" | "stale" | "error" | "stalled";
export type FetchOrigin = "swr" | "effect" | "unknown";
export type FetchMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "unknown";

/**
 * Parsed representation of URL params from a fetch call.
 * Used to detect param shape mismatches between calls to the same endpoint.
 *
 * e.g. /api/compliance/findings?auditId=A-101  →  { auditId: "A-101" }
 *      /api/compliance/findings?audit=A-101    →  { audit: "A-101" }   ← MISMATCH flagged
 */
export interface ParamSnapshot {
  url: string;
  pathname: string;
  queryParams: Record<string, string>;
  bodyParams: Record<string, unknown> | null;
  method: FetchMethod;
  capturedAt: number;
}

/**
 * A flag raised when the same endpoint is called with inconsistent param keys.
 * e.g. sometimes { auditId } and sometimes { audit }.
 */
export interface ParamMismatch {
  id: string;
  endpoint: string; // pathname only, e.g. /api/compliance/findings
  seenParamSets: string[][]; // each unique set of param key names observed
  firstSeenAt: number;
  lastSeenAt: number;
  occurrences: number;
  exampleUrls: string[]; // up to 3 example full URLs for debugging
}

/** A single fetch event captured by the fetch observer or SWR middleware */
export interface FetchEvent {
  id: string;
  timestamp: number;
  url: string;
  pathname: string;
  method: FetchMethod;
  origin: FetchOrigin; // 'swr' | 'effect' | 'unknown'
  route: string; // Next.js pathname at time of fetch
  status: number | null; // HTTP response status, null if in-flight
  duration: number | null;
  params: ParamSnapshot;
  swrKey: string | null; // set if origin === 'swr'
}

/** Per-route fetch practice summary — used for the coverage/audit view */
export interface RouteCoverage {
  route: string;
  totalFetches: number;
  swrFetches: number;
  effectFetches: number; // useEffect + raw fetch
  unknownFetches: number;
  duplicateUrls: string[]; // URLs fetched by both SWR and useEffect on this route
  inconsistentUrls: string[]; // URLs with param mismatches on this route
  coveragePct: number; // swrFetches / totalFetches * 100
}

// ─── SWR Hook entry (unchanged shape, extended) ───────────────────────────────

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
  /** Last HTTP status code seen for this key — catches silent 4xx with no thrown error */
  lastHttpStatus: number | null;
  /** Number of 4xx responses seen — likely param bugs */
  badRequestCount: number;
  /** Last URL actually used by this hook — for param inspection */
  lastUrl: string | null;
  /** Param snapshots from last 3 calls — enables mismatch detection */
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
  | "external-error" // v0.3: non-SWR fetches
  | "param-mismatch" // v0.3: param shape changed
  | "duplicate-fetch"; // v0.3: same URL via SWR + effect

export interface TimelineEvent {
  id: string;
  timestamp: number;
  type: TimelineEventType;
  key: string;
  duration: number | null;
  route: string;
  concurrentWith: string[];
  httpStatus: number | null; // v0.3
  origin: FetchOrigin; // v0.3
  flagged: boolean; // v0.3: true for param mismatches, duplicates, 4xx
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

// ─── Store ───────────────────────────────────────────────────────────────────

class HooksLensStore extends EventTarget {
  private hooks = new Map<string, HookEntry>();
  private hookRoutes = new Map<string, Set<string>>();
  private timeline: TimelineEvent[] = [];
  private waterfall: WaterfallEntry[] = [];
  private fetchEvents: FetchEvent[] = [];
  private paramMismatches = new Map<string, ParamMismatch>();
  private inFlight = new Map<string, number>();
  private stallTimers = new Map<string, ReturnType<typeof setTimeout>>();

  // Tracks which URLs have been fetched via SWR on a given route
  private swrUrlsByRoute = new Map<string, Set<string>>();
  // Tracks which URLs have been fetched via useEffect/fetch on a given route
  private effectUrlsByRoute = new Map<string, Set<string>>();

  private readonly maxTimeline = 500;
  private readonly maxWaterfall = 100;
  private readonly maxFetchEvents = 500;
  private readonly maxRecentParams = 3;

  // ── SWR hook lifecycle ────────────────────────────────────────────────────

  registerHook(
    key: string,
    type: "query" | "mutation",
    refreshInterval?: number,
    route = "/",
  ) {
    const existing = this.hooks.get(key);
    const routeSet = this.hookRoutes.get(key) ?? new Set<string>();
    routeSet.add(route);
    this.hookRoutes.set(key, routeSet);

    this.hooks.set(key, {
      key,
      type,
      status: existing?.status ?? "fresh",
      instances: (existing?.instances ?? 0) + 1,
      refreshInterval: refreshInterval ?? null,
      lastDuration: existing?.lastDuration ?? null,
      lastFetchedAt: existing?.lastFetchedAt ?? null,
      fetchStartedAt: existing?.fetchStartedAt ?? null,
      errorCount: existing?.errorCount ?? 0,
      slowCount: existing?.slowCount ?? 0,
      routes: Array.from(routeSet),
      lastHttpStatus: existing?.lastHttpStatus ?? null,
      badRequestCount: existing?.badRequestCount ?? 0,
      lastUrl: existing?.lastUrl ?? null,
      recentParams: existing?.recentParams ?? [],
    });
    this.emit("hooks:updated");
  }

  registerCustomHook(input: {
    name: string;
    description: string | null;
    fetchKey: string | null;
    custom: boolean;
    route: string;
    registeredAt: number;
  }) {
    const existing = this.hooks.get(input.name);
    this.registerHook(input.name, "query", undefined, input.route);

    if (existing) {
      this.hooks.set(input.name, {
        ...this.hooks.get(input.name)!,
        lastUrl: input.fetchKey ?? existing.lastUrl,
      });
      this.emit("hooks:updated");
    }
  }

  unregisterHook(key: string, route = "/") {
    const existing = this.hooks.get(key);
    if (!existing) return;
    if (existing.instances <= 1) {
      this.hooks.delete(key);
      this.hookRoutes.delete(key);
      this.clearStallTimer(key);
    } else {
      this.hooks.set(key, { ...existing, instances: existing.instances - 1 });
    }
    this.emit("hooks:updated");
  }

  unregisterCustomHook(name: string, route = "/") {
    this.unregisterHook(name, route);
  }

  recordFetchStart(key: string, route = "/", url?: string) {
    const now = Date.now();
    const existing = this.hooks.get(key);
    const concurrentWith = Array.from(this.inFlight.keys()).filter(
      (k) => k !== key,
    );
    this.inFlight.set(key, now);

    // Parse URL params for param inspection
    const params = url ? this.parseParams(url, "GET") : null;

    if (existing) {
      const updatedParams = params
        ? [params, ...existing.recentParams].slice(0, this.maxRecentParams)
        : existing.recentParams;

      this.hooks.set(key, {
        ...existing,
        status: "fetching",
        fetchStartedAt: now,
        lastUrl: url ?? existing.lastUrl,
        recentParams: updatedParams,
      });

      // Check for param shape mismatch across recent calls
      if (updatedParams.length >= 2) {
        this.detectParamMismatch(key, updatedParams, route);
      }
    }

    // Track SWR URL for duplicate detection
    if (url) {
      const parsed = this.tryParseUrl(url);
      if (parsed) {
        const routeUrls = this.swrUrlsByRoute.get(route) ?? new Set();
        routeUrls.add(parsed.pathname);
        this.swrUrlsByRoute.set(route, routeUrls);
        this.checkDuplicateFetch(parsed.pathname, route, "swr", key);
      }
    }

    this.clearStallTimer(key);
    this.stallTimers.set(
      key,
      setTimeout(() => {
        const current = this.hooks.get(key);
        if (current?.status === "fetching") {
          this.hooks.set(key, { ...current, status: "stalled" });
          this.pushEvent({
            type: "stalled",
            key,
            duration: STALL_THRESHOLD_MS,
            route,
            concurrentWith: [],
            httpStatus: null,
            origin: "swr",
            flagged: true,
          });
          this.emit("hooks:updated");
        }
      }, STALL_THRESHOLD_MS),
    );

    this.pushEvent({
      type: "fetch",
      key,
      duration: null,
      route,
      concurrentWith,
      httpStatus: null,
      origin: "swr",
      flagged: false,
    });
    this.addWaterfallEntry({
      key,
      route,
      origin: "swr",
      startedAt: now,
      concurrent: concurrentWith,
    });
    this.emit("hooks:updated");
  }

  recordFetchSuccess(
    key: string,
    duration: number,
    route = "/",
    httpStatus = 200,
  ) {
    const existing = this.hooks.get(key);
    const isSlow = duration >= SLOW_FETCH_THRESHOLD_MS;
    this.inFlight.delete(key);
    this.clearStallTimer(key);

    if (existing) {
      this.hooks.set(key, {
        ...existing,
        status: "fresh",
        lastDuration: duration,
        lastFetchedAt: Date.now(),
        fetchStartedAt: null,
        slowCount: existing.slowCount + (isSlow ? 1 : 0),
        lastHttpStatus: httpStatus,
      });
    }

    this.pushEvent({
      type: "success",
      key,
      duration,
      route,
      concurrentWith: [],
      httpStatus,
      origin: "swr",
      flagged: false,
    });
    if (isSlow)
      this.pushEvent({
        type: "slow",
        key,
        duration,
        route,
        concurrentWith: [],
        httpStatus,
        origin: "swr",
        flagged: true,
      });
    this.completeWaterfallEntry(
      key,
      duration,
      isSlow ? "slow" : "success",
      httpStatus,
    );
    this.emit("hooks:updated");
  }

  recordFetchError(
    key: string,
    duration: number,
    route = "/",
    httpStatus?: number,
  ) {
    const existing = this.hooks.get(key);
    this.inFlight.delete(key);
    this.clearStallTimer(key);

    const isBadRequest =
      httpStatus !== undefined && httpStatus >= 400 && httpStatus < 500;

    if (existing) {
      this.hooks.set(key, {
        ...existing,
        status: "error",
        errorCount: existing.errorCount + 1,
        lastDuration: duration,
        fetchStartedAt: null,
        lastHttpStatus: httpStatus ?? null,
        badRequestCount: existing.badRequestCount + (isBadRequest ? 1 : 0),
      });
    }

    this.pushEvent({
      type: "error",
      key,
      duration,
      route,
      concurrentWith: [],
      httpStatus: httpStatus ?? null,
      origin: "swr",
      flagged: isBadRequest,
    });
    this.completeWaterfallEntry(key, duration, "error", httpStatus ?? null);
    this.emit("hooks:updated");
  }

  recordDedup(key: string, route = "/") {
    this.pushEvent({
      type: "dedup",
      key,
      duration: null,
      route,
      concurrentWith: [],
      httpStatus: null,
      origin: "swr",
      flagged: false,
    });
  }

  recordMutationStart(key: string, route = "/", url?: string) {
    const existing = this.hooks.get(key);
    if (existing)
      this.hooks.set(key, {
        ...existing,
        status: "fetching",
        fetchStartedAt: Date.now(),
        lastUrl: url ?? existing.lastUrl,
      });
    this.pushEvent({
      type: "mutation",
      key,
      duration: null,
      route,
      concurrentWith: [],
      httpStatus: null,
      origin: "swr",
      flagged: false,
    });
    this.emit("hooks:updated");
  }

  recordMutationSuccess(
    key: string,
    duration: number,
    route = "/",
    httpStatus = 200,
  ) {
    const existing = this.hooks.get(key);
    if (existing)
      this.hooks.set(key, {
        ...existing,
        status: "fresh",
        lastDuration: duration,
        fetchStartedAt: null,
        lastHttpStatus: httpStatus,
      });
    this.pushEvent({
      type: "mutation-success",
      key,
      duration,
      route,
      concurrentWith: [],
      httpStatus,
      origin: "swr",
      flagged: false,
    });
    this.emit("hooks:updated");
  }

  recordMutationError(
    key: string,
    duration: number,
    route = "/",
    httpStatus?: number,
  ) {
    const existing = this.hooks.get(key);
    const isBadRequest =
      httpStatus !== undefined && httpStatus >= 400 && httpStatus < 500;
    if (existing)
      this.hooks.set(key, {
        ...existing,
        status: "error",
        errorCount: existing.errorCount + 1,
        fetchStartedAt: null,
        lastHttpStatus: httpStatus ?? null,
        badRequestCount: existing.badRequestCount + (isBadRequest ? 1 : 0),
      });
    this.pushEvent({
      type: "mutation-error",
      key,
      duration,
      route,
      concurrentWith: [],
      httpStatus: httpStatus ?? null,
      origin: "swr",
      flagged: isBadRequest,
    });
    this.emit("hooks:updated");
  }

  // ── External fetch observer (v0.3) ─────────────────────────────────────────
  // Called by the window.fetch wrapper installed by installFetchObserver()

  recordExternalFetchStart(
    url: string,
    method: FetchMethod,
    route: string,
    fetchId: string,
  ) {
    const parsed = this.tryParseUrl(url);
    const pathname = parsed?.pathname ?? url;

    // Track for duplicate detection
    const routeUrls = this.effectUrlsByRoute.get(route) ?? new Set();
    routeUrls.add(pathname);
    this.effectUrlsByRoute.set(route, routeUrls);
    this.checkDuplicateFetch(pathname, route, "effect", fetchId);

    const params = this.parseParams(url, method);
    const event: FetchEvent = {
      id: fetchId,
      timestamp: Date.now(),
      url,
      pathname,
      method,
      origin: "effect",
      route,
      status: null,
      duration: null,
      params,
      swrKey: null,
    };
    this.fetchEvents.unshift(event);
    if (this.fetchEvents.length > this.maxFetchEvents) this.fetchEvents.pop();

    this.pushEvent({
      type: "external-fetch",
      key: url,
      duration: null,
      route,
      concurrentWith: [],
      httpStatus: null,
      origin: "effect",
      flagged: false,
    });
    this.addWaterfallEntry({
      key: pathname,
      route,
      origin: "effect",
      startedAt: Date.now(),
      concurrent: [],
    });
    this.emit("fetch:external");
  }

  recordExternalFetchDone(
    fetchId: string,
    duration: number,
    httpStatus: number,
    route: string,
    url: string,
  ) {
    const pathname = this.tryParseUrl(url)?.pathname ?? url;
    const isBadRequest = httpStatus >= 400 && httpStatus < 500;
    const isSlow = duration >= SLOW_FETCH_THRESHOLD_MS;
    const isError = httpStatus >= 400;

    // Update fetch event record
    const idx = this.fetchEvents.findIndex((e) => e.id === fetchId);
    if (idx !== -1) {
      this.fetchEvents[idx] = {
        ...this.fetchEvents[idx],
        status: httpStatus,
        duration,
      };
    }

    const type = isError ? "external-error" : "external-success";
    this.pushEvent({
      type,
      key: url,
      duration,
      route,
      concurrentWith: [],
      httpStatus,
      origin: "effect",
      flagged: isBadRequest || isSlow,
    });
    if (isSlow)
      this.pushEvent({
        type: "slow",
        key: url,
        duration,
        route,
        concurrentWith: [],
        httpStatus,
        origin: "effect",
        flagged: true,
      });

    this.completeWaterfallEntry(
      pathname,
      duration,
      isError ? "error" : isSlow ? "slow" : "success",
      httpStatus,
    );
    this.emit("fetch:external");
  }

  // ── Param mismatch detection (v0.3) ────────────────────────────────────────

  private detectParamMismatch(
    key: string,
    snapshots: ParamSnapshot[],
    route: string,
  ) {
    if (snapshots.length < 2) return;

    // Compare the set of query param KEYS (not values) across snapshots
    const paramKeySets = snapshots.map((s) =>
      Object.keys(s.queryParams).sort().join(","),
    );
    const uniqueSets = new Set(paramKeySets);

    if (uniqueSets.size <= 1) return; // All consistent — no mismatch

    const endpoint = snapshots[0].pathname;
    const existing = this.paramMismatches.get(endpoint);
    const exampleUrls = snapshots.map((s) => s.url).slice(0, 3);

    this.paramMismatches.set(endpoint, {
      id: existing?.id ?? crypto.randomUUID(),
      endpoint,
      seenParamSets: Array.from(uniqueSets).map((s) =>
        s.split(",").filter(Boolean),
      ),
      firstSeenAt: existing?.firstSeenAt ?? Date.now(),
      lastSeenAt: Date.now(),
      occurrences: (existing?.occurrences ?? 0) + 1,
      exampleUrls,
    });

    // Push a flagged timeline event so it appears prominently
    this.pushEvent({
      type: "param-mismatch",
      key,
      duration: null,
      route,
      concurrentWith: [],
      httpStatus: null,
      origin: "swr",
      flagged: true,
    });

    this.emit("hooks:updated");
  }

  private checkDuplicateFetch(
    pathname: string,
    route: string,
    origin: FetchOrigin,
    key: string,
  ) {
    const swrUrls = this.swrUrlsByRoute.get(route) ?? new Set();
    const effectUrls = this.effectUrlsByRoute.get(route) ?? new Set();

    const isDuplicate =
      origin === "swr" ? effectUrls.has(pathname) : swrUrls.has(pathname);

    if (isDuplicate) {
      this.pushEvent({
        type: "duplicate-fetch",
        key,
        duration: null,
        route,
        concurrentWith: [],
        httpStatus: null,
        origin,
        flagged: true,
      });
      this.emit("hooks:updated");
    }
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  getHooks(): HookEntry[] {
    return Array.from(this.hooks.values());
  }
  getTimeline(): TimelineEvent[] {
    return [...this.timeline];
  }
  getWaterfall(): WaterfallEntry[] {
    return [...this.waterfall];
  }
  getParamMismatches(): ParamMismatch[] {
    return Array.from(this.paramMismatches.values());
  }
  getFetchEvents(): FetchEvent[] {
    return [...this.fetchEvents];
  }

  getRoutes(): string[] {
    const all = new Set<string>();
    for (const s of this.hookRoutes.values()) for (const r of s) all.add(r);
    return Array.from(all).sort();
  }

  /** Per-route coverage — what % of fetches go through SWR vs raw fetch */
  getRouteCoverage(): RouteCoverage[] {
    const routes = new Set<string>([
      ...this.swrUrlsByRoute.keys(),
      ...this.effectUrlsByRoute.keys(),
    ]);

    return Array.from(routes)
      .map((route) => {
        const swrUrls = this.swrUrlsByRoute.get(route) ?? new Set();
        const effectUrls = this.effectUrlsByRoute.get(route) ?? new Set();

        // URLs fetched by BOTH SWR and useEffect on the same route
        const duplicateUrls = Array.from(swrUrls).filter((u) =>
          effectUrls.has(u),
        );

        // Param mismatches observed on this route
        const inconsistentUrls = Array.from(this.paramMismatches.values())
          .filter((m) => {
            const hooks = this.getHooks();
            return hooks.some(
              (h) =>
                h.routes.includes(route) && h.lastUrl?.includes(m.endpoint),
            );
          })
          .map((m) => m.endpoint);

        const swrCount = swrUrls.size;
        const effectCount = effectUrls.size;
        const total = swrCount + effectCount;

        return {
          route,
          totalFetches: total,
          swrFetches: swrCount,
          effectFetches: effectCount,
          unknownFetches: 0,
          duplicateUrls,
          inconsistentUrls,
          coveragePct: total > 0 ? Math.round((swrCount / total) * 100) : 0,
        };
      })
      .sort((a, b) => b.totalFetches - a.totalFetches);
  }

  /** Diagnostic summary across all three goal areas */
  getDiagnostics() {
    const hooks = this.getHooks();
    const mismatches = this.getParamMismatches();
    const coverage = this.getRouteCoverage();

    return {
      // Goal 1 — performance
      slowKeys: hooks
        .filter((h) => h.slowCount > 0)
        .sort((a, b) => b.slowCount - a.slowCount),
      stalledKeys: hooks.filter((h) => h.status === "stalled"),
      highInstanceKeys: hooks.filter((h) => h.instances >= 4),

      // Goal 2 — param bugs
      paramMismatches: mismatches,
      badRequestKeys: hooks.filter((h) => h.badRequestCount > 0),

      // Goal 3 — fetch practice
      lowCoverageRoutes: coverage.filter(
        (r) => r.coveragePct < 50 && r.totalFetches >= 2,
      ),
      duplicateFetchRoutes: coverage.filter((r) => r.duplicateUrls.length > 0),
      effectOnlyRoutes: coverage.filter(
        (r) => r.swrFetches === 0 && r.effectFetches > 0,
      ),

      pollingKeys: hooks.filter((h) => h.refreshInterval !== null),
      errorKeys: hooks
        .filter((h) => h.errorCount > 0)
        .sort((a, b) => b.errorCount - a.errorCount),
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private parseParams(url: string, method: FetchMethod): ParamSnapshot {
    const parsed = this.tryParseUrl(url);
    const queryParams: Record<string, string> = {};

    if (parsed) {
      parsed.searchParams.forEach((value, key) => {
        queryParams[key] = value;
      });
    }

    return {
      url,
      pathname: parsed?.pathname ?? url,
      queryParams,
      bodyParams: null, // populated separately for POST/PUT/PATCH
      method,
      capturedAt: Date.now(),
    };
  }

  private tryParseUrl(url: string): URL | null {
    try {
      return new URL(url, "http://localhost");
    } catch {
      return null;
    }
  }

  private addWaterfallEntry(
    entry: Pick<
      WaterfallEntry,
      "key" | "route" | "origin" | "startedAt" | "concurrent"
    >,
  ) {
    this.waterfall.unshift({
      id: crypto.randomUUID(),
      completedAt: null,
      duration: null,
      status: "pending",
      httpStatus: null,
      ...entry,
    });
    if (this.waterfall.length > this.maxWaterfall) this.waterfall.pop();
  }

  private completeWaterfallEntry(
    key: string,
    duration: number,
    status: WaterfallEntry["status"],
    httpStatus: number | null,
  ) {
    const idx = this.waterfall.findIndex(
      (w) => w.key === key && w.status === "pending",
    );
    if (idx !== -1) {
      this.waterfall[idx] = {
        ...this.waterfall[idx],
        completedAt: Date.now(),
        duration,
        status,
        httpStatus,
      };
    }
  }

  private pushEvent(event: Omit<TimelineEvent, "id" | "timestamp">) {
    this.timeline.unshift({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...event,
    });
    if (this.timeline.length > this.maxTimeline) this.timeline.pop();
    this.dispatchEvent(new Event("timeline:updated"));
  }

  private clearStallTimer(key: string) {
    const t = this.stallTimers.get(key);
    if (t) {
      clearTimeout(t);
      this.stallTimers.delete(key);
    }
  }

  private emit(event: string) {
    this.dispatchEvent(new Event(event));
  }
}

// Singleton pattern to preserve store across Next.js Fast Refresh
const globalForStore = globalThis as unknown as {
  hooksLensStore: HooksLensStore | undefined;
};

export const hooksLensStore =
  globalForStore.hooksLensStore ?? new HooksLensStore();

if (process.env.NODE_ENV !== "production") {
  globalForStore.hooksLensStore = hooksLensStore;
}

export const insightStore = hooksLensStore;

// Set up BroadcastChannel listener for cross-tab synchronization
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  try {
    const channel = new BroadcastChannel("hookslens-events");
    channel.onmessage = (event) => {
      const { type, payload } = event.data;

      switch (type) {
        case "fetch:start":
          if (payload.hookType) {
            hooksLensStore.registerHook(
              payload.key,
              payload.hookType,
              payload.refreshInterval,
              payload.route,
            );
          }
          hooksLensStore.recordFetchStart(
            payload.key,
            payload.route,
            payload.url,
          );
          break;

        case "fetch:success":
          hooksLensStore.recordFetchSuccess(
            payload.key,
            payload.duration,
            payload.route,
            payload.httpStatus,
          );
          break;

        case "fetch:error":
          hooksLensStore.recordFetchError(
            payload.key,
            payload.duration,
            payload.route,
            payload.httpStatus,
          );
          break;

        case "mutation:start":
          if (payload.hookType) {
            hooksLensStore.registerHook(
              payload.key,
              payload.hookType,
              payload.refreshInterval,
              payload.route,
            );
          }
          hooksLensStore.recordMutationStart(
            payload.key,
            payload.route,
            payload.url,
          );
          break;

        case "mutation:success":
          hooksLensStore.recordMutationSuccess(
            payload.key,
            payload.duration,
            payload.route,
            payload.httpStatus,
          );
          break;

        case "mutation:error":
          hooksLensStore.recordMutationError(
            payload.key,
            payload.duration,
            payload.route,
            payload.httpStatus,
          );
          break;

        case "external:fetch:start":
          hooksLensStore.recordExternalFetchStart(
            payload.url,
            payload.method,
            payload.route,
            payload.fetchId,
          );
          break;

        case "external:fetch:done":
          hooksLensStore.recordExternalFetchDone(
            payload.fetchId,
            payload.duration,
            payload.httpStatus,
            payload.route,
            payload.url,
          );
          break;
      }
    };
  } catch {
    // BroadcastChannel not supported - local tracking only
  }
}
