import type { HookEntry, ParamMismatch, RouteCoverage } from "./types";

/**
 * DiagnosticsBuilder is responsible for analyzing hooks, mismatches, and coverage
 * to generate diagnostic insights. This separates diagnostic logic from the store,
 * following composition over inheritance principles.
 */
export class DiagnosticsBuilder {
  constructor(
    private readonly highInstanceThreshold: number,
    private readonly lowCoverageThreshold: number,
    private readonly minFetchesForCoverage: number,
  ) {}

  build(
    hooks: HookEntry[],
    mismatches: ParamMismatch[],
    coverage: RouteCoverage[],
  ) {
    return {
      slowKeys: this.findSlowHooks(hooks),
      stalledKeys: this.findStalledHooks(hooks),
      highInstanceKeys: this.findHighInstanceHooks(hooks),
      paramMismatches: mismatches,
      badRequestKeys: this.findBadRequestHooks(hooks),
      lowCoverageRoutes: this.findLowCoverageRoutes(coverage),
      duplicateFetchRoutes: this.findDuplicateFetchRoutes(coverage),
      effectOnlyRoutes: this.findEffectOnlyRoutes(coverage),
      pollingKeys: this.findPollingHooks(hooks),
      errorKeys: this.findErrorHooks(hooks),
    };
  }

  private findSlowHooks(hooks: HookEntry[]): HookEntry[] {
    return hooks
      .filter((hook) => hook.slowCount > 0)
      .sort((a, b) => b.slowCount - a.slowCount);
  }

  private findStalledHooks(hooks: HookEntry[]): HookEntry[] {
    return hooks.filter((hook) => hook.status === "stalled");
  }

  private findHighInstanceHooks(hooks: HookEntry[]): HookEntry[] {
    return hooks.filter((hook) => hook.instances >= this.highInstanceThreshold);
  }

  private findBadRequestHooks(hooks: HookEntry[]): HookEntry[] {
    return hooks.filter((hook) => hook.badRequestCount > 0);
  }

  private findLowCoverageRoutes(coverage: RouteCoverage[]): RouteCoverage[] {
    return coverage.filter(
      (route) =>
        route.coveragePct < this.lowCoverageThreshold &&
        route.totalFetches >= this.minFetchesForCoverage,
    );
  }

  private findDuplicateFetchRoutes(coverage: RouteCoverage[]): RouteCoverage[] {
    return coverage.filter((route) => route.duplicateUrls.length > 0);
  }

  private findEffectOnlyRoutes(coverage: RouteCoverage[]): RouteCoverage[] {
    return coverage.filter(
      (route) => route.swrFetches === 0 && route.effectFetches > 0,
    );
  }

  private findPollingHooks(hooks: HookEntry[]): HookEntry[] {
    return hooks.filter((hook) => hook.refreshInterval !== null);
  }

  private findErrorHooks(hooks: HookEntry[]): HookEntry[] {
    return hooks
      .filter((hook) => hook.errorCount > 0)
      .sort((a, b) => b.errorCount - a.errorCount);
  }
}
