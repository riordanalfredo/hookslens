import type { CustomHookRegistration, HookEntry } from "./types";

/**
 * HookCatalog maintains a registry of all active hooks in the application, along with their metadata and associated routes. It provides methods to register and unregister hooks, as well as retrieve hook information for diagnostics and UI display.
 */
export class HookCatalog {
  private readonly hooks = new Map<string, HookEntry>();
  private readonly hookRoutes = new Map<string, Set<string>>();

  registerHook(
    key: string,
    type: "query" | "mutation",
    refreshInterval: number | undefined,
    route: string,
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
  }

  registerCustomHook(input: CustomHookRegistration) {
    const existing = this.hooks.get(input.name);
    this.registerHook(input.name, "query", undefined, input.route);

    if (existing) {
      this.hooks.set(input.name, {
        ...this.hooks.get(input.name)!,
        lastUrl: input.fetchKey ?? existing.lastUrl,
      });
    }
  }

  unregisterHook(key: string): { changed: boolean; deleted: boolean } {
    const existing = this.hooks.get(key);
    if (!existing) return { changed: false, deleted: false };

    if (existing.instances <= 1) {
      this.hooks.delete(key);
      this.hookRoutes.delete(key);
      return { changed: true, deleted: true };
    }

    this.hooks.set(key, { ...existing, instances: existing.instances - 1 });
    return { changed: true, deleted: false };
  }

  get(key: string): HookEntry | undefined {
    return this.hooks.get(key);
  }

  set(key: string, entry: HookEntry) {
    this.hooks.set(key, entry);
  }

  all(): HookEntry[] {
    return Array.from(this.hooks.values());
  }

  routes(): string[] {
    const all = new Set<string>();
    for (const routeSet of this.hookRoutes.values()) {
      for (const route of routeSet) {
        all.add(route);
      }
    }
    return Array.from(all).sort();
  }
}
