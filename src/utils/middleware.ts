import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { Middleware, SWRHook } from "swr";
import { hooksLensStore, FetchMethod } from "./store";

/**
 * hooksLensMiddleware — SWR middleware for hookslens.
 *
 * Intercepts every useSWR and useSWRMutation call and records:
 *  - Hook registration and route-scoped lifecycle
 *  - Fetch start/success/error with duration
 *  - HTTP status codes (including non-thrown 4xx responses)
 *  - URL + param snapshots for mismatch detection
 *  - Concurrent requests and stalled request signals
 *
 * @example
 * // app/providers.tsx
 * <SWRConfig value={{ use: [hooksLensMiddleware] }}>
 *   <AuditWorkspace />
 * </SWRConfig>
 *
 * @example
 * // Typical key pattern from the demo context
 * useSWR(['/api/compliance/findings', { auditId, controlId }], fetcher)
 */
export const hooksLensMiddleware: Middleware = (useSWRNext: SWRHook) => {
  return (key, fetcher, config) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const pathname = usePathname() ?? "/";

    const serializedKey = Array.isArray(key)
      ? JSON.stringify(key)
      : String(key ?? "");

    const isMutation = (config as any)?._isHook === false;
    const type = isMutation ? "mutation" : "query";
    const refreshInterval =
      typeof config?.refreshInterval === "number"
        ? config.refreshInterval
        : undefined;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      hooksLensStore.registerHook(
        serializedKey,
        type,
        refreshInterval,
        pathname,
      );
      return () => hooksLensStore.unregisterHook(serializedKey, pathname);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serializedKey, pathname]);

    const wrappedFetcher = fetcher
      ? async (...args: any[]) => {
          // Fetcher arg[0] is usually the SWR key, often a URL or tuple key.
          const url =
            typeof args[0] === "string"
              ? args[0]
              : Array.isArray(args[0])
                ? args[0][0]
                : undefined;

          const method: FetchMethod = isMutation ? "POST" : "GET";
          const start = performance.now();

          if (isMutation) {
            hooksLensStore.recordMutationStart(serializedKey, pathname, url);
          } else {
            hooksLensStore.recordFetchStart(serializedKey, pathname, url);
          }

          try {
            const result = await (fetcher as any)(...args);
            const duration = Math.round(performance.now() - start);

            // Some fetchers attach status on the response payload.
            // Capture it so non-thrown 4xx still surface in diagnostics.
            const httpStatus = (result as any)?.__status ?? 200;

            if (isMutation) {
              hooksLensStore.recordMutationSuccess(
                serializedKey,
                duration,
                pathname,
                httpStatus,
              );
            } else {
              hooksLensStore.recordFetchSuccess(
                serializedKey,
                duration,
                pathname,
                httpStatus,
              );
            }

            return result;
          } catch (err: any) {
            const duration = Math.round(performance.now() - start);

            // Normalize HTTP status from common error shapes:
            // axios -> err.response.status
            // thrown fetch wrapper -> err.status
            // custom error -> err.statusCode
            const httpStatus =
              err?.response?.status ??
              err?.status ??
              err?.statusCode ??
              undefined;

            if (isMutation) {
              hooksLensStore.recordMutationError(
                serializedKey,
                duration,
                pathname,
                httpStatus,
              );
            } else {
              hooksLensStore.recordFetchError(
                serializedKey,
                duration,
                pathname,
                httpStatus,
              );
            }

            throw err;
          }
        }
      : fetcher;

    return useSWRNext(key, wrappedFetcher, config);
  };
};
