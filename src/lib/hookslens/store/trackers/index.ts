import type { TimelineEvent } from "../types";

export { ParamMismatchTracker } from "./ParamMismatchTracker";
export { RouteCoverageTracker } from "./RouteCoverageTracker";
export { WaterfallTracker } from "./WaterfallTracker";

import type { ParamMismatchTracker } from "./ParamMismatchTracker";
import type { RouteCoverageTracker } from "./RouteCoverageTracker";
import type { WaterfallTracker } from "./WaterfallTracker";

export interface StatelessTracker<TSnapshot> {
  snapshot(): TSnapshot;
}

export interface ContextTracker<TSnapshot, TContext> {
  snapshot(context: TContext): TSnapshot;
}

export type TimelineEventDraft = Omit<TimelineEvent, "id" | "timestamp">;

export interface TrackerRegistry {
  paramMismatch: ParamMismatchTracker;
  routeCoverage: RouteCoverageTracker;
  waterfall: WaterfallTracker;
}

export type TrackerName = keyof TrackerRegistry;
