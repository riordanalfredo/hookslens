/**
 * Event simulation script for HooksLens development
 * Generates realistic hook events and timeline data to help with debugging and development
 */

import { hooksLensStore } from "@/lib/hookslens/store";

declare global {
  interface ImportMetaEnv {
    readonly DEV?: boolean;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_ROUTES = [
  "/products/[productId]",
  "/catalog",
  "/orders",
  "/cart",
  "/dashboard",
];

interface MockHookConfig {
  hookName: string;
  key: string;
  type: "query" | "mutation";
  routes: string[];
  status: "fresh" | "fetching" | "error" | "stalled";
  interval?: number;
  hasError?: boolean;
  httpStatus?: number;
  avgDuration?: number;
}

const MOCK_HOOKS: MockHookConfig[] = [
  // Product page hooks
  {
    hookName: "useProduct",
    key: "/api/products/[productId]",
    type: "query",
    routes: ["/products/[productId]"],
    status: "fresh",
    httpStatus: 200,
    avgDuration: 89,
  },
  {
    hookName: "useReviews",
    key: "['/api/reviews',{productId:'P-301',page:1}]",
    type: "query",
    routes: ["/products/[productId]"],
    status: "error",
    hasError: true,
    httpStatus: 400,
    avgDuration: 150,
  },
  {
    hookName: "useInventory",
    key: "/api/inventory/[productId]",
    type: "query",
    routes: ["/products/[productId]"],
    status: "fresh",
    interval: 10000, // 10s polling
    httpStatus: 200,
    avgDuration: 203,
  },
  {
    hookName: "addToCart",
    key: "addToCart",
    type: "mutation",
    routes: ["/products/[productId]"],
    status: "fresh",
    httpStatus: 200,
    avgDuration: 312,
  },

  // Catalog page hooks
  {
    hookName: "useProductList",
    key: "['/api/products',{page:1,category:'electronics'}]",
    type: "query",
    routes: ["/catalog"],
    status: "fresh",
    httpStatus: 200,
    avgDuration: 142,
  },

  // Orders page hooks
  {
    hookName: "useOrders",
    key: "/api/orders/[userId]",
    type: "query",
    routes: ["/orders"],
    status: "error",
    hasError: true,
    httpStatus: 500,
    avgDuration: 4021,
  },

  // Cart page hooks
  {
    hookName: "useCart",
    key: "/api/cart/current",
    type: "query",
    routes: ["/cart"],
    status: "stalled",
    interval: 3000, // 3s polling
    httpStatus: 200,
    avgDuration: 95,
  },

  // Dashboard hooks
  {
    hookName: "useAnalytics",
    key: "/api/analytics/summary",
    type: "query",
    routes: ["/dashboard"],
    status: "fresh",
    httpStatus: 200,
    avgDuration: 156,
  },
  {
    hookName: "useRecentActivity",
    key: "/api/activity/recent",
    type: "query",
    routes: ["/dashboard"],
    status: "fresh",
    interval: 5000, // 5s polling
    httpStatus: 200,
    avgDuration: 78,
  },
];

// ─── Helper Functions ───────────────────────────────────────────────────────

function randomDuration(base: number, variance = 0.3): number {
  const min = base * (1 - variance);
  const max = base * (1 + variance);
  return Math.floor(Math.random() * (max - min) + min);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Event Generation ───────────────────────────────────────────────────────

class EventSimulator {
  private running = false;
  private intervalIds: NodeJS.Timeout[] = [];
  private activeRoute: string;

  constructor() {
    this.activeRoute = MOCK_ROUTES[0];
  }

  start() {
    if (this.running) {
      console.warn("[EventSimulator] Already running");
      return;
    }

    this.running = true;
    console.log("[EventSimulator] Starting event simulation...");

    // Initialize hooks in store
    this.initializeHooks();

    // Start periodic event generation
    this.startPeriodicEvents();

    // Simulate polling hooks
    this.startPollingSimulation();
  }

  stop() {
    if (!this.running) {
      return;
    }

    this.running = false;
    this.intervalIds.forEach(clearInterval);
    this.intervalIds = [];
    console.log("[EventSimulator] Stopped event simulation");
  }

  setRoute(route: string) {
    if (MOCK_ROUTES.includes(route)) {
      this.activeRoute = route;
      console.log(`[EventSimulator] Switched to route: ${route}`);
    }
  }

  private initializeHooks() {
    MOCK_HOOKS.forEach((config) => {
      // Register hook in store using the proper API
      hooksLensStore.registerHook(
        config.key,
        config.type,
        config.interval,
        config.routes[0],
      );
    });

    console.log(`[EventSimulator] Initialized ${MOCK_HOOKS.length} mock hooks`);
  }

  private startPeriodicEvents() {
    // Generate random successful fetches
    const successInterval = setInterval(() => {
      if (!this.running) return;

      if (Math.random() < 0.5) {
        const configs = MOCK_HOOKS.filter(
          (h) =>
            h.routes.includes(this.activeRoute) &&
            h.type === "query" &&
            !h.hasError,
        );

        if (configs.length > 0) {
          const config = pickRandom(configs);
          this.generateFetchEvent(config, "success");
        }
      }
    }, 2500);

    // Generate occasional errors
    const errorInterval = setInterval(() => {
      if (!this.running) return;

      if (Math.random() < 0.2) {
        const configs = MOCK_HOOKS.filter(
          (h) => h.hasError && h.routes.includes(this.activeRoute),
        );

        if (configs.length > 0) {
          const config = pickRandom(configs);
          this.generateFetchEvent(config, "error");
        }
      }
    }, 5000);

    // Generate mutation events
    const mutationInterval = setInterval(() => {
      if (!this.running) return;

      if (Math.random() < 0.3) {
        const configs = MOCK_HOOKS.filter(
          (h) => h.type === "mutation" && h.routes.includes(this.activeRoute),
        );

        if (configs.length > 0) {
          const config = pickRandom(configs);
          this.generateMutationEvent(config);
        }
      }
    }, 4000);

    this.intervalIds.push(successInterval, errorInterval, mutationInterval);
  }

  private startPollingSimulation() {
    MOCK_HOOKS.filter((h) => h.interval).forEach((config) => {
      const pollingInterval = setInterval(() => {
        if (!this.running) return;

        // Only generate events if this hook's route is active
        if (config.routes.includes(this.activeRoute)) {
          this.generateFetchEvent(config, "success", true);
        }
      }, config.interval!);

      this.intervalIds.push(pollingInterval);
    });
  }

  private generateFetchEvent(
    config: MockHookConfig,
    result: "success" | "error",
    _isPolling = false,
  ) {
    const route = config.routes[0];
    const duration = config.avgDuration
      ? randomDuration(config.avgDuration)
      : Math.floor(Math.random() * 200 + 50);
    const httpStatus = config.httpStatus || (result === "success" ? 200 : 500);

    // Simulate fetch lifecycle using store API
    hooksLensStore.recordFetchStart(config.key, route, config.key);

    // Simulate completion after a short delay
    setTimeout(() => {
      if (result === "success") {
        hooksLensStore.recordFetchSuccess(
          config.key,
          duration,
          route,
          httpStatus,
        );
      } else {
        hooksLensStore.recordFetchError(
          config.key,
          duration,
          route,
          httpStatus,
        );
      }
    }, 10);
  }

  private generateMutationEvent(config: MockHookConfig) {
    const route = config.routes[0];
    const duration = config.avgDuration
      ? randomDuration(config.avgDuration)
      : Math.floor(Math.random() * 400 + 100);
    const httpStatus = config.httpStatus || 200;

    // Simulate mutation lifecycle using store API
    hooksLensStore.recordMutationStart(config.key, route, config.key);

    // Simulate completion after a short delay
    setTimeout(() => {
      hooksLensStore.recordMutationSuccess(
        config.key,
        duration,
        route,
        httpStatus,
      );
    }, 10);
  }

  clearTimeline() {
    console.log("[EventSimulator] Timeline cleared (not implemented in store)");
  }
}

// ─── Singleton Instance ─────────────────────────────────────────────────────

export const eventSimulator = new EventSimulator();

// Auto-start in development
if (import.meta.env?.DEV) {
  console.log(
    "[EventSimulator] Auto-starting in development mode. Use eventSimulator.stop() to stop.",
  );
  eventSimulator.start();

  // Make it available globally for debugging
  (window as any).eventSimulator = eventSimulator;
}
