import { hooksLensStore, FetchMethod } from "@/lib/hookslens/store";
import { createId } from "./id";

let installed = false;

let broadcastChannel: BroadcastChannel | null = null;
let channelInitAttempted = false;

function broadcastEvent(type: string, payload: any) {
  if (!channelInitAttempted && typeof window !== "undefined") {
    channelInitAttempted = true;
    try {
      broadcastChannel = new BroadcastChannel("hookslens-events");
    } catch {
      // BroadcastChannel not supported, will fall back to local-only tracking
    }
  }

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type, payload });
    } catch {
      // Silently ignore errors - local store still works
    }
  }
}

/**
 * installFetchObserver()
 *
 * Wraps window.fetch to intercept ALL client-side HTTP calls, not just SWR.
 * This captures:
 *   - legacy useEffect + fetch() patterns
 *   - compliance dashboard API calls not routed through SWR middleware
 *   - any other raw browser fetch calls
 *
 * Calls that originated from SWR are tagged as 'swr' by the middleware.
 * Everything else is tagged as 'effect' (came from outside SWR).
 *
 * The observer is idempotent — calling it twice has no effect.
 * It is automatically removed in production (NODE_ENV check).
 *
 * @example
 * // src/app/providers.tsx
 * 'use client';
 * import { installFetchObserver } from 'hookslens';
 *
 * export function Providers({ children }) {
 *   useEffect(() => {
 *     installFetchObserver();
 *   }, []);
 *   return <SWRConfig ...>{children}</SWRConfig>;
 * }
 */
export function installFetchObserver() {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV !== "development") return;
  if (installed) return;

  installed = true;
  const original = window.fetch;

  window.fetch = async function hooksLensFetch(input, init) {
    // Resolve URL and method
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;

    const method = (
      init?.method ?? (input instanceof Request ? input.method : "GET")
    ).toUpperCase() as FetchMethod;

    // Get current Next.js pathname from the URL bar (best effort in client context)
    const route =
      typeof window !== "undefined" ? window.location.pathname : "/";

    const fetchId = createId();

    hooksLensStore.recordExternalFetchStart(url, method, route, fetchId);
    broadcastEvent("external:fetch:start", {
      url,
      method,
      route,
      fetchId,
    });

    const start = performance.now();

    try {
      const response = await original.call(window, input, init);
      const duration = Math.round(performance.now() - start);

      // Clone to avoid consuming the body
      hooksLensStore.recordExternalFetchDone(
        fetchId,
        duration,
        response.status,
        route,
        url,
      );
      broadcastEvent("external:fetch:done", {
        fetchId,
        duration,
        httpStatus: response.status,
        route,
        url,
      });

      return response;
    } catch (err) {
      const duration = Math.round(performance.now() - start);
      // Network error — no HTTP status
      hooksLensStore.recordExternalFetchDone(fetchId, duration, 0, route, url);
      broadcastEvent("external:fetch:done", {
        fetchId,
        duration,
        httpStatus: 0,
        route,
        url,
      });
      throw err;
    }
  };
}

export function uninstallFetchObserver() {
  // No-op if not installed; useful for test cleanup
  installed = false;
}
