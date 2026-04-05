import {
  SLOW_FETCH_THRESHOLD_MS,
  STALL_THRESHOLD_MS,
  type CustomHookRegistration,
  type FetchEvent,
  type FetchMethod,
  type HookEntry,
  type ParamMismatch,
  type RouteCoverage,
  type TimelineEvent,
  type WaterfallEntry,
} from "./types";

import { createId } from "../id";
import { DiagnosticsBuilder } from "./DiagnosticsBuilder";
import { HookCatalog } from "./HookCatalog";
import { RequestLifecycleCoordinator } from "./RequestLifecycleCoordinator";
import {
  ParamMismatchTracker,
  RouteCoverageTracker,
  WaterfallTracker,
  type TrackerRegistry,
  type TrackerName,
} from "./trackers/index";

export interface HooksLensStoreSnapshot {
  hooks: HookEntry[];
  timeline: TimelineEvent[];
  waterfall: WaterfallEntry[];
  routeCoverage: RouteCoverage[];
  diagnostics: ReturnType<HooksLensStore["getDiagnostics"]>;
  routes: string[];
  fetchEvents: FetchEvent[];
}

/**
 * HooksLensStore is the central state management class for HooksLens. It maintains the registry of hooks, tracks fetch events, and generates diagnostics based on the collected data. It uses an event-driven architecture to notify subscribers of updates to hooks and timeline events.
 */
export class HooksLensStore extends EventTarget {
  private readonly maxTimeline = 500;
  private readonly maxWaterfall = 100;
  private readonly maxFetchEvents = 500;
  private readonly maxRecentParams = 3;
  private readonly defaultRoute = "/";

  // Diagnostic thresholds
  private readonly highInstanceThreshold = 4;
  private readonly lowCoverageThreshold = 50;
  private readonly minFetchesForCoverage = 2;

  private readonly hookCatalog = new HookCatalog();
  private timeline: TimelineEvent[] = [];
  private fetchEvents: FetchEvent[] = [];
  private readonly trackers: TrackerRegistry;
  private readonly diagnosticsBuilder: DiagnosticsBuilder;
  private readonly requestLifecycle: RequestLifecycleCoordinator;

  constructor() {
    super();
    this.diagnosticsBuilder = new DiagnosticsBuilder(
      this.highInstanceThreshold,
      this.lowCoverageThreshold,
      this.minFetchesForCoverage,
    );
    this.trackers = {
      paramMismatch: new ParamMismatchTracker(),
      routeCoverage: new RouteCoverageTracker(),
      waterfall: new WaterfallTracker(this.maxWaterfall),
    };
    this.requestLifecycle = new RequestLifecycleCoordinator({
      hookCatalog: this.hookCatalog,
      trackers: this.trackers,
      maxRecentParams: this.maxRecentParams,
      maxFetchEvents: this.maxFetchEvents,
      fetchEvents: this.fetchEvents,
      pushEvent: (event) => this.pushEvent(event),
      emitHooksUpdated: () => this.emit("hooks:updated"),
      emitExternalFetch: () => this.emit("fetch:external"),
    });
  }

  registerHook(
    key: string,
    type: "query" | "mutation",
    refreshInterval?: number,
    route = this.defaultRoute,
  ) {
    this.hookCatalog.registerHook(key, type, refreshInterval, route);
    this.emit("hooks:updated");
  }

  registerCustomHook(input: CustomHookRegistration) {
    this.hookCatalog.registerCustomHook(input);
    this.emit("hooks:updated");
  }

  unregisterHook(key: string, route = this.defaultRoute) {
    const result = this.hookCatalog.unregisterHook(key);
    if (!result.changed) return;
    if (result.deleted) {
      this.requestLifecycle.onHookDeleted(key);
    }
    this.emit("hooks:updated");
  }

  unregisterCustomHook(name: string, route = this.defaultRoute) {
    this.unregisterHook(name, route);
  }

  snapshot(): HooksLensStoreSnapshot {
    const hooks = this.getHooks();
    const timeline = this.getTimeline();
    const { waterfall, paramMismatches, routeCoverage } =
      this.buildTrackerData(hooks);

    return {
      hooks,
      timeline,
      waterfall,
      routeCoverage,
      diagnostics: this.buildDiagnostics(hooks, paramMismatches, routeCoverage),
      routes: this.getRoutes(),
      fetchEvents: this.getFetchEvents(),
    };
  }

  recordFetchStart(key: string, route = this.defaultRoute, url?: string) {
    this.requestLifecycle.recordFetchStart(key, route, url);
  }

  recordFetchSuccess(
    key: string,
    duration: number,
    route = this.defaultRoute,
    httpStatus = 200,
  ) {
    this.requestLifecycle.recordFetchSuccess(key, duration, route, httpStatus);
  }

  recordFetchError(
    key: string,
    duration: number,
    route = this.defaultRoute,
    httpStatus?: number,
  ) {
    this.requestLifecycle.recordFetchError(key, duration, route, httpStatus);
  }

  recordDedup(key: string, route = this.defaultRoute) {
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

  recordMutationStart(key: string, route = this.defaultRoute, url?: string) {
    this.requestLifecycle.recordMutationStart(key, route, url);
  }

  recordMutationSuccess(
    key: string,
    duration: number,
    route = this.defaultRoute,
    httpStatus = 200,
  ) {
    this.requestLifecycle.recordMutationSuccess(
      key,
      duration,
      route,
      httpStatus,
    );
  }

  recordMutationError(
    key: string,
    duration: number,
    route = this.defaultRoute,
    httpStatus?: number,
  ) {
    this.requestLifecycle.recordMutationError(key, duration, route, httpStatus);
  }

  recordExternalFetchStart(
    url: string,
    method: FetchMethod,
    route: string,
    fetchId: string,
  ) {
    this.requestLifecycle.recordExternalFetchStart(url, method, route, fetchId);
  }

  recordExternalFetchDone(
    fetchId: string,
    duration: number,
    httpStatus: number,
    route: string,
    url: string,
  ) {
    this.requestLifecycle.recordExternalFetchDone(
      fetchId,
      duration,
      httpStatus,
      route,
      url,
    );
  }

  getHooks(): HookEntry[] {
    return this.hookCatalog.all();
  }

  getTimeline(): TimelineEvent[] {
    return [...this.timeline];
  }

  getFetchEvents(): FetchEvent[] {
    return [...this.fetchEvents];
  }

  getRoutes(): string[] {
    return this.hookCatalog.routes();
  }

  getRouteCoverage(): RouteCoverage[] {
    return this.getTracker("routeCoverage").snapshot({
      hooks: this.getHooks(),
      paramMismatches: this.getTracker("paramMismatch").snapshot(),
    });
  }

  getDiagnostics() {
    const hooks = this.getHooks();
    const { paramMismatches, routeCoverage } = this.buildTrackerData(hooks);
    return this.buildDiagnostics(hooks, paramMismatches, routeCoverage);
  }

  private getTracker<K extends TrackerName>(key: K): TrackerRegistry[K] {
    return this.trackers[key];
  }

  private buildTrackerData(hooks: HookEntry[]): {
    waterfall: WaterfallEntry[];
    paramMismatches: ParamMismatch[];
    routeCoverage: RouteCoverage[];
  } {
    const paramMismatches = this.getTracker("paramMismatch").snapshot();
    return {
      waterfall: this.getTracker("waterfall").snapshot(),
      paramMismatches,
      routeCoverage: this.getTracker("routeCoverage").snapshot({
        hooks,
        paramMismatches,
      }),
    };
  }

  private buildDiagnostics(
    hooks: HookEntry[],
    mismatches: ParamMismatch[],
    coverage: RouteCoverage[],
  ) {
    return this.diagnosticsBuilder.build(hooks, mismatches, coverage);
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

  private emit(eventName: string) {
    this.dispatchEvent(new Event(eventName));
  }
}
