import type { FetchMethod, ParamMismatch, ParamSnapshot } from "../types";
import { createId } from "../../id";
import type { TimelineEventDraft } from "./index";

export class ParamMismatchTracker {
  private mismatches = new Map<string, ParamMismatch>();

  parseParams(url: string, method: FetchMethod): ParamSnapshot {
    const parsed = this.tryParseUrl(url);
    const queryParams: Record<string, string> = {};

    if (parsed) {
      parsed.searchParams.forEach((value, key) => {
        queryParams[key] = value;
      });
    }

    return {
      url,
      pathname: parsed?.pathname ?? url,
      queryParams,
      bodyParams: null,
      method,
      capturedAt: Date.now(),
    };
  }

  detectMismatch(
    key: string,
    snapshots: ParamSnapshot[],
    route: string,
  ): TimelineEventDraft | null {
    if (snapshots.length < 2) return null;

    const paramKeySets = snapshots.map((snapshot) =>
      Object.keys(snapshot.queryParams).sort().join(","),
    );
    const uniqueSets = new Set(paramKeySets);
    if (uniqueSets.size <= 1) return null;

    const endpoint = snapshots[0].pathname;
    const existing = this.mismatches.get(endpoint);
    const exampleUrls = snapshots.map((snapshot) => snapshot.url).slice(0, 3);

    this.mismatches.set(endpoint, {
      id: existing?.id ?? createId(),
      endpoint,
      seenParamSets: Array.from(uniqueSets).map((set) =>
        set.split(",").filter(Boolean),
      ),
      firstSeenAt: existing?.firstSeenAt ?? Date.now(),
      lastSeenAt: Date.now(),
      occurrences: (existing?.occurrences ?? 0) + 1,
      exampleUrls,
    });

    return {
      type: "param-mismatch",
      key,
      duration: null,
      route,
      concurrentWith: [],
      httpStatus: null,
      origin: "swr",
      flagged: true,
    };
  }

  snapshot(): ParamMismatch[] {
    return Array.from(this.mismatches.values());
  }

  private tryParseUrl(url: string): URL | null {
    try {
      return new URL(url, "http://localhost");
    } catch {
      return null;
    }
  }
}
