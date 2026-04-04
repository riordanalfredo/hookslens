import { describe, expect, it, vi } from "vitest";
import {
  SLOW_FETCH_THRESHOLD_MS,
  STALL_THRESHOLD_MS,
  hooksLensStore,
} from "../lib/hookslens/store";

describe("hooksLensStore", () => {
  it("registers/unregisters hook instances and routes", () => {
    hooksLensStore.registerHook("key:findings", "query", 1000, "/compliance");
    hooksLensStore.registerHook(
      "key:findings",
      "query",
      1000,
      "/compliance/audits",
    );

    const hook = hooksLensStore
      .getHooks()
      .find((h) => h.key === "key:findings");

    expect(hook).toBeDefined();
    expect(hook?.instances).toBe(2);
    expect(hook?.routes.sort()).toEqual(["/compliance", "/compliance/audits"]);

    hooksLensStore.unregisterHook("key:findings", "/compliance/audits");
    let remaining = hooksLensStore
      .getHooks()
      .find((h) => h.key === "key:findings");
    expect(remaining?.instances).toBe(1);

    hooksLensStore.unregisterHook("key:findings", "/compliance");
    remaining = hooksLensStore.getHooks().find((h) => h.key === "key:findings");
    expect(remaining).toBeUndefined();
  });

  it("records fetch success and marks slow events", () => {
    hooksLensStore.registerHook("key:slow", "query", undefined, "/compliance");
    hooksLensStore.recordFetchStart(
      "key:slow",
      "/compliance",
      "/api/compliance/evidence?auditId=A-101",
    );
    hooksLensStore.recordFetchSuccess(
      "key:slow",
      SLOW_FETCH_THRESHOLD_MS,
      "/compliance",
      200,
    );

    const hook = hooksLensStore.getHooks().find((h) => h.key === "key:slow");
    const timeline = hooksLensStore.getTimeline();

    expect(hook?.status).toBe("fresh");
    expect(hook?.slowCount).toBeGreaterThan(0);
    expect(
      timeline.some((e) => e.type === "slow" && e.key === "key:slow"),
    ).toBe(true);
  });

  it("records mutation errors with bad request tracking", () => {
    hooksLensStore.registerHook(
      "key:mutation",
      "mutation",
      undefined,
      "/compliance",
    );
    hooksLensStore.recordMutationStart(
      "key:mutation",
      "/compliance",
      "/api/compliance/remediation-plan",
    );
    hooksLensStore.recordMutationError("key:mutation", 80, "/compliance", 422);

    const hook = hooksLensStore
      .getHooks()
      .find((h) => h.key === "key:mutation");

    expect(hook?.status).toBe("error");
    expect(hook?.errorCount).toBeGreaterThan(0);
    expect(hook?.badRequestCount).toBeGreaterThan(0);
    expect(hook?.lastHttpStatus).toBe(422);
  });

  it("captures external fetches and route coverage", () => {
    hooksLensStore.recordFetchStart(
      "key:swr",
      "/compliance/audits/A-101",
      "/api/compliance/findings?auditId=A-101",
    );
    hooksLensStore.recordFetchSuccess(
      "key:swr",
      120,
      "/compliance/audits/A-101",
      200,
    );

    hooksLensStore.recordExternalFetchStart(
      "/api/compliance/findings?audit=A-101",
      "GET",
      "/compliance/audits/A-101",
      "external-1",
    );
    hooksLensStore.recordExternalFetchDone(
      "external-1",
      90,
      200,
      "/compliance/audits/A-101",
      "/api/compliance/findings?audit=A-101",
    );

    const coverage = hooksLensStore
      .getRouteCoverage()
      .find((r) => r.route === "/compliance/audits/A-101");
    const duplicateEvent = hooksLensStore
      .getTimeline()
      .find(
        (e) =>
          e.type === "duplicate-fetch" &&
          e.route === "/compliance/audits/A-101",
      );

    expect(coverage).toBeDefined();
    expect(coverage?.swrFetches).toBeGreaterThan(0);
    expect(coverage?.effectFetches).toBeGreaterThan(0);
    expect(coverage?.duplicateUrls).toContain("/api/compliance/findings");
    expect(duplicateEvent?.flagged).toBe(true);
  });

  it("moves hooks to stalled when fetch remains in-flight", async () => {
    vi.useFakeTimers();
    hooksLensStore.registerHook("key:stall", "query", undefined, "/stall");
    hooksLensStore.recordFetchStart("key:stall", "/stall", "/api/stall");

    await vi.advanceTimersByTimeAsync(STALL_THRESHOLD_MS + 20);

    const hook = hooksLensStore.getHooks().find((h) => h.key === "key:stall");
    expect(hook?.status).toBe("stalled");

    hooksLensStore.recordFetchError(
      "key:stall",
      STALL_THRESHOLD_MS + 20,
      "/stall",
    );
    hooksLensStore.unregisterHook("key:stall", "/stall");
    vi.useRealTimers();
  });
});
