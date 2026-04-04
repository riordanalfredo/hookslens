import {
  SLOW_FETCH_THRESHOLD_MS,
  STALL_THRESHOLD_MS,
  type CustomHookRegistration,
  type FetchEvent,
  type FetchMethod,
  type FetchOrigin,
  type HookEntry,
  type ParamMismatch,
  type ParamSnapshot,
  type RouteCoverage,
  type TimelineEvent,
  type WaterfallEntry,
} from "./types";
import { createId } from "../id";

export class HooksLensStore extends EventTarget {
  private hooks = new Map<string, HookEntry>();
  private hookRoutes = new Map<string, Set<string>>();
  private timeline: TimelineEvent[] = [];
  private waterfall: WaterfallEntry[] = [];
  private fetchEvents: FetchEvent[] = [];
  private paramMismatches = new Map<string, ParamMismatch>();
  private inFlight = new Map<string, number>();
  private stallTimers = new Map<string, ReturnType<typeof setTimeout>>();

  private swrUrlsByRoute = new Map<string, Set<string>>();
  private effectUrlsByRoute = new Map<string, Set<string>>();

  private readonly maxTimeline = 500;
  private readonly maxWaterfall = 100;
  private readonly maxFetchEvents = 500;
  private readonly maxRecentParams = 3;

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

  registerCustomHook(input: CustomHookRegistration) {
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
      (inFlightKey) => inFlightKey !== key,
    );
    this.inFlight.set(key, now);

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

      if (updatedParams.length >= 2) {
        this.detectParamMismatch(key, updatedParams, route);
      }
    }

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
    if (isSlow) {
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
    }

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
    if (existing) {
      this.hooks.set(key, {
        ...existing,
        status: "fetching",
        fetchStartedAt: Date.now(),
        lastUrl: url ?? existing.lastUrl,
      });
    }

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
    if (existing) {
      this.hooks.set(key, {
        ...existing,
        status: "fresh",
        lastDuration: duration,
        fetchStartedAt: null,
        lastHttpStatus: httpStatus,
      });
    }

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

    if (existing) {
      this.hooks.set(key, {
        ...existing,
        status: "error",
        errorCount: existing.errorCount + 1,
        fetchStartedAt: null,
        lastHttpStatus: httpStatus ?? null,
        badRequestCount: existing.badRequestCount + (isBadRequest ? 1 : 0),
      });
    }

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

  recordExternalFetchStart(
    url: string,
    method: FetchMethod,
    route: string,
    fetchId: string,
  ) {
    const parsed = this.tryParseUrl(url);
    const pathname = parsed?.pathname ?? url;

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

    const idx = this.fetchEvents.findIndex((event) => event.id === fetchId);
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
    if (isSlow) {
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
    }

    this.completeWaterfallEntry(
      pathname,
      duration,
      isError ? "error" : isSlow ? "slow" : "success",
      httpStatus,
    );
    this.emit("fetch:external");
  }

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
    for (const routeSet of this.hookRoutes.values()) {
      for (const route of routeSet) {
        all.add(route);
      }
    }
    return Array.from(all).sort();
  }

  getRouteCoverage(): RouteCoverage[] {
    const routes = new Set<string>([
      ...this.swrUrlsByRoute.keys(),
      ...this.effectUrlsByRoute.keys(),
    ]);

    return Array.from(routes)
      .map((route) => {
        const swrUrls = this.swrUrlsByRoute.get(route) ?? new Set();
        const effectUrls = this.effectUrlsByRoute.get(route) ?? new Set();

        const duplicateUrls = Array.from(swrUrls).filter((url) =>
          effectUrls.has(url),
        );

        const hooks = this.getHooks();
        const inconsistentUrls = Array.from(this.paramMismatches.values())
          .filter((mismatch) => {
            return hooks.some(
              (hook) =>
                hook.routes.includes(route) &&
                hook.lastUrl?.includes(mismatch.endpoint),
            );
          })
          .map((mismatch) => mismatch.endpoint);

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

  getDiagnostics() {
    const hooks = this.getHooks();
    const mismatches = this.getParamMismatches();
    const coverage = this.getRouteCoverage();

    return {
      slowKeys: hooks
        .filter((hook) => hook.slowCount > 0)
        .sort((a, b) => b.slowCount - a.slowCount),
      stalledKeys: hooks.filter((hook) => hook.status === "stalled"),
      highInstanceKeys: hooks.filter((hook) => hook.instances >= 4),
      paramMismatches: mismatches,
      badRequestKeys: hooks.filter((hook) => hook.badRequestCount > 0),
      lowCoverageRoutes: coverage.filter(
        (route) => route.coveragePct < 50 && route.totalFetches >= 2,
      ),
      duplicateFetchRoutes: coverage.filter(
        (route) => route.duplicateUrls.length > 0,
      ),
      effectOnlyRoutes: coverage.filter(
        (route) => route.swrFetches === 0 && route.effectFetches > 0,
      ),
      pollingKeys: hooks.filter((hook) => hook.refreshInterval !== null),
      errorKeys: hooks
        .filter((hook) => hook.errorCount > 0)
        .sort((a, b) => b.errorCount - a.errorCount),
    };
  }

  private detectParamMismatch(
    key: string,
    snapshots: ParamSnapshot[],
    route: string,
  ) {
    if (snapshots.length < 2) return;

    const paramKeySets = snapshots.map((snapshot) =>
      Object.keys(snapshot.queryParams).sort().join(","),
    );
    const uniqueSets = new Set(paramKeySets);
    if (uniqueSets.size <= 1) return;

    const endpoint = snapshots[0].pathname;
    const existing = this.paramMismatches.get(endpoint);
    const exampleUrls = snapshots.map((snapshot) => snapshot.url).slice(0, 3);

    this.paramMismatches.set(endpoint, {
      id: existing?.id ?? createId(),
      endpoint,
      seenParamSets: Array.from(uniqueSets).map((set) =>
        set.split(",").filter(Boolean),
      ),
      firstSeenAt: existing?.firstSeenAt ?? Date.now(),
      lastSeenAt: Date.now(),
      occurrences: (existing?.occurrences ?? 0) + 1,
      exampleUrls,
    });

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
      bodyParams: null,
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
      id: createId(),
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
      (entry) => entry.key === key && entry.status === "pending",
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
      id: createId(),
      timestamp: Date.now(),
      ...event,
    });
    if (this.timeline.length > this.maxTimeline) this.timeline.pop();
    this.dispatchEvent(new Event("timeline:updated"));
  }

  private clearStallTimer(key: string) {
    const timer = this.stallTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.stallTimers.delete(key);
    }
  }

  private emit(eventName: string) {
    this.dispatchEvent(new Event(eventName));
  }
}
