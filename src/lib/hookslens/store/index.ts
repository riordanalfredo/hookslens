import { DiagnosticsBuilder } from "./DiagnosticsBuilder";
import { HookCatalog } from "./HookCatalog";
import { RequestLifecycleCoordinator } from "./RequestLifecycleCoordinator";
import { HooksLensStore } from "./core";
import { setupBroadcastListener } from "./helper";

export {
  HooksLensStore,
  DiagnosticsBuilder,
  HookCatalog,
  RequestLifecycleCoordinator,
};

export type {
  CustomHookRegistration,
  FetchEvent,
  FetchMethod,
  FetchOrigin,
  HookEntry,
  HookStatus,
  ParamMismatch,
  ParamSnapshot,
  RouteCoverage,
  TimelineEvent,
  TimelineEventType,
  WaterfallEntry,
} from "./types";

export { SLOW_FETCH_THRESHOLD_MS, STALL_THRESHOLD_MS } from "./types";

// Initialise singleton store with broadcast support
const globalForStore = globalThis as unknown as {
  hooksLensStore: HooksLensStore | undefined;
};

export const hooksLensStore =
  globalForStore.hooksLensStore ?? new HooksLensStore();

if (process.env.NODE_ENV !== "production") {
  globalForStore.hooksLensStore = hooksLensStore;
}

setupBroadcastListener(hooksLensStore);
