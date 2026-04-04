import type { HooksLensStore } from "./core";

const shouldDebugCatch = () => {
  if (process.env.NODE_ENV !== "development") return false;
  return process.env.NEXT_PUBLIC_HOOKSLENS_DEBUG === "1";
};

const debugCatch = (scope: string, error: unknown) => {
  if (!shouldDebugCatch()) return;
  console.warn(`[hookslens:${scope}]`, error);
};

export function setupBroadcastListener(store: HooksLensStore) {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV !== "development") return;

  try {
    const channel = new BroadcastChannel("hookslens-events");
    channel.onmessage = (event) => {
      const { type, payload } = (event.data ?? {}) as {
        type?: string;
        payload?: any;
      };

      switch (type) {
        case "fetch:start":
          if (payload?.hookType) {
            store.registerHook(
              payload.key,
              payload.hookType,
              payload.refreshInterval,
              payload.route,
            );
          }
          store.recordFetchStart(payload?.key, payload?.route, payload?.url);
          break;

        case "fetch:success":
          store.recordFetchSuccess(
            payload?.key,
            payload?.duration,
            payload?.route,
            payload?.httpStatus,
          );
          break;

        case "fetch:error":
          store.recordFetchError(
            payload?.key,
            payload?.duration,
            payload?.route,
            payload?.httpStatus,
          );
          break;

        case "mutation:start":
          if (payload?.hookType) {
            store.registerHook(
              payload.key,
              payload.hookType,
              payload.refreshInterval,
              payload.route,
            );
          }
          store.recordMutationStart(payload?.key, payload?.route, payload?.url);
          break;

        case "mutation:success":
          store.recordMutationSuccess(
            payload?.key,
            payload?.duration,
            payload?.route,
            payload?.httpStatus,
          );
          break;

        case "mutation:error":
          store.recordMutationError(
            payload?.key,
            payload?.duration,
            payload?.route,
            payload?.httpStatus,
          );
          break;

        case "external:fetch:start":
          store.recordExternalFetchStart(
            payload?.url,
            payload?.method,
            payload?.route,
            payload?.fetchId,
          );
          break;

        case "external:fetch:done":
          store.recordExternalFetchDone(
            payload?.fetchId,
            payload?.duration,
            payload?.httpStatus,
            payload?.route,
            payload?.url,
          );
          break;
      }
    };
  } catch (error) {
    debugCatch("broadcast", error);
  }
}
