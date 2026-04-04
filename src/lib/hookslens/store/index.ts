import { HooksLensStore } from "./core";
import { setupBroadcastListener } from "./broadcast";

export {
  SLOW_FETCH_THRESHOLD_MS,
  STALL_THRESHOLD_MS,
  type CustomHookRegistration,
  type FetchEvent,
  type FetchMethod,
  type FetchOrigin,
  type HookEntry,
  type HookStatus,
  type ParamMismatch,
  type ParamSnapshot,
  type RouteCoverage,
  type TimelineEvent,
  type TimelineEventType,
  type WaterfallEntry,
} from "./types";

const globalForStore = globalThis as unknown as {
  hooksLensStore: HooksLensStore | undefined;
};

export const hooksLensStore =
  globalForStore.hooksLensStore ?? new HooksLensStore();

if (process.env.NODE_ENV !== "production") {
  globalForStore.hooksLensStore = hooksLensStore;
}

setupBroadcastListener(hooksLensStore);

export const insightStore = hooksLensStore;
