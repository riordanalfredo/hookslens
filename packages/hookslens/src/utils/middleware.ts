import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { Middleware, SWRHook } from "swr";
import { hooksLensStore, FetchMethod } from "./store";

/**
 * hooksLensMiddleware — SWR middleware for hookslens.
 *
 * Intercepts every useSWR and useSWRMutation call and pipes:
 *  - Hook registration / unregistration with route
 *  - Fetch lifecycle (start, success, error) with duration
 *  - HTTP status codes (catches silent 4xx that don't throw)
 *  - URL and param snapshots for param mismatch detection
 *  - Concurrency and stall detection
 *
 * @example
 * <SWRConfig value={{ use: [hooksLensMiddleware] }}>
 *   <App />
 * </SWRConfig>
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
          // The first arg to the fetcher is the key, which is often the URL
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

            // If the result has a status property (common fetcher pattern),
            // capture it for 4xx detection
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

            // Extract HTTP status from common error shapes:
            // axios: err.response.status
            // fetch + throw: err.status
            // custom: err.statusCode
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
