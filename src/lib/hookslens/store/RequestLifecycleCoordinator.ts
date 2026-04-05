import {
  SLOW_FETCH_THRESHOLD_MS,
  STALL_THRESHOLD_MS,
  type FetchEvent,
  type FetchMethod,
  type TimelineEvent,
} from "./types";
import { HookCatalog } from "./HookCatalog";
import type { TrackerRegistry } from "./trackers/index";

type TimelineEventDraft = Omit<TimelineEvent, "id" | "timestamp">;

interface RequestLifecycleCoordinatorDeps {
  hookCatalog: HookCatalog;
  trackers: TrackerRegistry;
  maxRecentParams: number;
  maxFetchEvents: number;
  fetchEvents: FetchEvent[];
  pushEvent: (event: TimelineEventDraft) => void;
  emitHooksUpdated: () => void;
  emitExternalFetch: () => void;
}

/**
 * RequestLifecycleCoordinator is responsible for coordinating the lifecycle of fetch requests initiated by hooks. It tracks in-flight requests, manages timers for detecting stalled requests, and interacts with the HookCatalog and trackers to update hook statuses and generate timeline events based on request outcomes.
 */
export class RequestLifecycleCoordinator {
  private readonly inFlight = new Map<string, number>();
  private readonly stallTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();

  constructor(private readonly deps: RequestLifecycleCoordinatorDeps) {}

  onHookDeleted(key: string) {
    this.inFlight.delete(key);
    this.clearStallTimer(key);
  }

  recordFetchStart(key: string, route: string, url?: string) {
    const now = Date.now();
    const existing = this.deps.hookCatalog.get(key);
    const concurrentWith = Array.from(this.inFlight.keys()).filter(
      (inFlightKey) => inFlightKey !== key,
    );
    this.inFlight.set(key, now);

    const params = url
      ? this.deps.trackers.paramMismatch.parseParams(url, "GET")
      : null;

    if (existing) {
      const updatedParams = params
        ? [params, ...existing.recentParams].slice(0, this.deps.maxRecentParams)
        : existing.recentParams;

      this.deps.hookCatalog.set(key, {
        ...existing,
        status: "fetching",
        fetchStartedAt: now,
        lastUrl: url ?? existing.lastUrl,
        recentParams: updatedParams,
      });

      if (updatedParams.length >= 2) {
        const mismatchEvent = this.deps.trackers.paramMismatch.detectMismatch(
          key,
          updatedParams,
          route,
        );
        if (mismatchEvent) {
          this.deps.pushEvent(mismatchEvent);
          this.deps.emitHooksUpdated();
        }
      }
    }

    if (params) {
      this.deps.trackers.routeCoverage.recordSWR(route, params.pathname);
      const duplicateEvent =
        this.deps.trackers.routeCoverage.buildDuplicateEvent(
          params.pathname,
          route,
          "swr",
          key,
        );
      if (duplicateEvent) {
        this.deps.pushEvent(duplicateEvent);
        this.deps.emitHooksUpdated();
      }
    }

    this.clearStallTimer(key);
    this.stallTimers.set(
      key,
      setTimeout(() => {
        const current = this.deps.hookCatalog.get(key);
        if (current?.status === "fetching") {
          this.deps.hookCatalog.set(key, { ...current, status: "stalled" });
          this.deps.pushEvent({
            type: "stalled",
            key,
            duration: STALL_THRESHOLD_MS,
            route,
            concurrentWith: [],
            httpStatus: null,
            origin: "swr",
            flagged: true,
          });
          this.deps.emitHooksUpdated();
        }
      }, STALL_THRESHOLD_MS),
    );

    this.deps.pushEvent({
      type: "fetch",
      key,
      duration: null,
      route,
      concurrentWith,
      httpStatus: null,
      origin: "swr",
      flagged: false,
    });

    this.deps.trackers.waterfall.add({
      key,
      route,
      origin: "swr",
      startedAt: now,
      concurrent: concurrentWith,
    });
    this.deps.emitHooksUpdated();
  }

  recordFetchSuccess(
    key: string,
    duration: number,
    route: string,
    httpStatus: number,
  ) {
    const existing = this.deps.hookCatalog.get(key);
    const isSlow = duration >= SLOW_FETCH_THRESHOLD_MS;
    this.inFlight.delete(key);
    this.clearStallTimer(key);

    if (existing) {
      this.deps.hookCatalog.set(key, {
        ...existing,
        status: "fresh",
        lastDuration: duration,
        lastFetchedAt: Date.now(),
        fetchStartedAt: null,
        slowCount: existing.slowCount + (isSlow ? 1 : 0),
        lastHttpStatus: httpStatus,
      });
    }

    this.deps.pushEvent({
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
      this.deps.pushEvent({
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

    this.deps.trackers.waterfall.complete(
      key,
      duration,
      isSlow ? "slow" : "success",
      httpStatus,
    );
    this.deps.emitHooksUpdated();
  }

  recordFetchError(
    key: string,
    duration: number,
    route: string,
    httpStatus?: number,
  ) {
    const existing = this.deps.hookCatalog.get(key);
    this.inFlight.delete(key);
    this.clearStallTimer(key);

    const isBadRequest =
      httpStatus !== undefined && httpStatus >= 400 && httpStatus < 500;

    if (existing) {
      this.deps.hookCatalog.set(key, {
        ...existing,
        status: "error",
        errorCount: existing.errorCount + 1,
        lastDuration: duration,
        fetchStartedAt: null,
        lastHttpStatus: httpStatus ?? null,
        badRequestCount: existing.badRequestCount + (isBadRequest ? 1 : 0),
      });
    }

    this.deps.pushEvent({
      type: "error",
      key,
      duration,
      route,
      concurrentWith: [],
      httpStatus: httpStatus ?? null,
      origin: "swr",
      flagged: isBadRequest,
    });
    this.deps.trackers.waterfall.complete(
      key,
      duration,
      "error",
      httpStatus ?? null,
    );
    this.deps.emitHooksUpdated();
  }

  recordMutationStart(key: string, route: string, url?: string) {
    const existing = this.deps.hookCatalog.get(key);
    if (existing) {
      this.deps.hookCatalog.set(key, {
        ...existing,
        status: "fetching",
        fetchStartedAt: Date.now(),
        lastUrl: url ?? existing.lastUrl,
      });
    }

    this.deps.pushEvent({
      type: "mutation",
      key,
      duration: null,
      route,
      concurrentWith: [],
      httpStatus: null,
      origin: "swr",
      flagged: false,
    });
    this.deps.emitHooksUpdated();
  }

  recordMutationSuccess(
    key: string,
    duration: number,
    route: string,
    httpStatus: number,
  ) {
    const existing = this.deps.hookCatalog.get(key);
    if (existing) {
      this.deps.hookCatalog.set(key, {
        ...existing,
        status: "fresh",
        lastDuration: duration,
        fetchStartedAt: null,
        lastHttpStatus: httpStatus,
      });
    }

    this.deps.pushEvent({
      type: "mutation-success",
      key,
      duration,
      route,
      concurrentWith: [],
      httpStatus,
      origin: "swr",
      flagged: false,
    });
    this.deps.emitHooksUpdated();
  }

  recordMutationError(
    key: string,
    duration: number,
    route: string,
    httpStatus?: number,
  ) {
    const existing = this.deps.hookCatalog.get(key);
    const isBadRequest =
      httpStatus !== undefined && httpStatus >= 400 && httpStatus < 500;

    if (existing) {
      this.deps.hookCatalog.set(key, {
        ...existing,
        status: "error",
        errorCount: existing.errorCount + 1,
        fetchStartedAt: null,
        lastHttpStatus: httpStatus ?? null,
        badRequestCount: existing.badRequestCount + (isBadRequest ? 1 : 0),
      });
    }

    this.deps.pushEvent({
      type: "mutation-error",
      key,
      duration,
      route,
      concurrentWith: [],
      httpStatus: httpStatus ?? null,
      origin: "swr",
      flagged: isBadRequest,
    });
    this.deps.emitHooksUpdated();
  }

  recordExternalFetchStart(
    url: string,
    method: FetchMethod,
    route: string,
    fetchId: string,
  ) {
    const params = this.deps.trackers.paramMismatch.parseParams(url, method);
    const pathname = params.pathname;

    this.deps.trackers.routeCoverage.recordEffect(route, pathname);
    const duplicateEvent = this.deps.trackers.routeCoverage.buildDuplicateEvent(
      pathname,
      route,
      "effect",
      fetchId,
    );
    if (duplicateEvent) {
      this.deps.pushEvent(duplicateEvent);
      this.deps.emitHooksUpdated();
    }

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
    this.deps.fetchEvents.unshift(event);
    if (this.deps.fetchEvents.length > this.deps.maxFetchEvents) {
      this.deps.fetchEvents.pop();
    }

    this.deps.pushEvent({
      type: "external-fetch",
      key: url,
      duration: null,
      route,
      concurrentWith: [],
      httpStatus: null,
      origin: "effect",
      flagged: false,
    });
    this.deps.trackers.waterfall.add({
      key: pathname,
      route,
      origin: "effect",
      startedAt: Date.now(),
      concurrent: [],
    });
    this.deps.emitExternalFetch();
  }

  recordExternalFetchDone(
    fetchId: string,
    duration: number,
    httpStatus: number,
    route: string,
    url: string,
  ) {
    const pathname = this.deps.trackers.paramMismatch.parseParams(
      url,
      "unknown",
    ).pathname;
    const isBadRequest = httpStatus >= 400 && httpStatus < 500;
    const isSlow = duration >= SLOW_FETCH_THRESHOLD_MS;
    const isError = httpStatus >= 400;

    const idx = this.deps.fetchEvents.findIndex(
      (event) => event.id === fetchId,
    );
    if (idx !== -1) {
      this.deps.fetchEvents[idx] = {
        ...this.deps.fetchEvents[idx],
        status: httpStatus,
        duration,
      };
    }

    const type = isError ? "external-error" : "external-success";
    this.deps.pushEvent({
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
      this.deps.pushEvent({
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

    this.deps.trackers.waterfall.complete(
      pathname,
      duration,
      isError ? "error" : isSlow ? "slow" : "success",
      httpStatus,
    );
    this.deps.emitExternalFetch();
  }

  private clearStallTimer(key: string) {
    const timer = this.stallTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.stallTimers.delete(key);
    }
  }
}
