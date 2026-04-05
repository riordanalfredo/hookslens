import type {
  FetchOrigin,
  HookEntry,
  ParamMismatch,
  RouteCoverage,
} from "../types";
import type { TimelineEventDraft } from "./index";

interface RouteCoverageContext {
  hooks: HookEntry[];
  paramMismatches: ParamMismatch[];
}

export class RouteCoverageTracker {
  private swrUrlsByRoute = new Map<string, Set<string>>();
  private effectUrlsByRoute = new Map<string, Set<string>>();

  recordSWR(route: string, pathname: string) {
    const routeUrls = this.swrUrlsByRoute.get(route) ?? new Set<string>();
    routeUrls.add(pathname);
    this.swrUrlsByRoute.set(route, routeUrls);
  }

  recordEffect(route: string, pathname: string) {
    const routeUrls = this.effectUrlsByRoute.get(route) ?? new Set<string>();
    routeUrls.add(pathname);
    this.effectUrlsByRoute.set(route, routeUrls);
  }

  buildDuplicateEvent(
    pathname: string,
    route: string,
    origin: FetchOrigin,
    key: string,
  ): TimelineEventDraft | null {
    const swrUrls = this.swrUrlsByRoute.get(route) ?? new Set<string>();
    const effectUrls = this.effectUrlsByRoute.get(route) ?? new Set<string>();

    const isDuplicate =
      origin === "swr" ? effectUrls.has(pathname) : swrUrls.has(pathname);

    if (!isDuplicate) return null;

    return {
      type: "duplicate-fetch",
      key,
      duration: null,
      route,
      concurrentWith: [],
      httpStatus: null,
      origin,
      flagged: true,
    };
  }

  snapshot({ hooks, paramMismatches }: RouteCoverageContext): RouteCoverage[] {
    const routes = new Set<string>([
      ...this.swrUrlsByRoute.keys(),
      ...this.effectUrlsByRoute.keys(),
    ]);

    return Array.from(routes)
      .map((route) => {
        const swrUrls = this.swrUrlsByRoute.get(route) ?? new Set<string>();
        const effectUrls =
          this.effectUrlsByRoute.get(route) ?? new Set<string>();

        const duplicateUrls = Array.from(swrUrls).filter((url) =>
          effectUrls.has(url),
        );

        const inconsistentUrls = paramMismatches
          .filter((mismatch: ParamMismatch) => {
            return hooks.some(
              (hook: HookEntry) =>
                hook.routes.includes(route) &&
                hook.lastUrl?.includes(mismatch.endpoint),
            );
          })
          .map((mismatch: ParamMismatch) => mismatch.endpoint);

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
}
