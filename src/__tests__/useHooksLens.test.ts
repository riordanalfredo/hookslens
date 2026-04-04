import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let cleanupEffect: (() => void) | undefined;

vi.mock("react", () => ({
  useEffect: (effect: () => void | (() => void)) => {
    const cleanup = effect();
    cleanupEffect = typeof cleanup === "function" ? cleanup : undefined;
  },
  useRef: <T>(initial: T) => ({ current: initial }),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

vi.mock("@/lib/hookslens/store", () => ({
  hooksLensStore: {
    registerCustomHook: vi.fn(),
    unregisterCustomHook: vi.fn(),
  },
}));

describe("useHooksLens", () => {
  beforeEach(() => {
    cleanupEffect = undefined;
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupEffect = undefined;
  });

  it("registers custom hook metadata in development", async () => {
    vi.stubEnv("NODE_ENV", "development");

    const nextNavigation = await import("next/navigation");
    vi.mocked(nextNavigation.usePathname).mockReturnValue("/dashboard");

    const { useHooksLens } = await import("../lib/hookslens/useHooksLens");
    const { hooksLensStore } = await import("@/lib/hookslens/store");

    useHooksLens({
      name: "useComplianceFindings",
      description: "Fetch compliance findings for audit",
      fetchKey:
        "/api/compliance/findings?auditId=A-101&controlId=164.312(a)(2)",
    });

    expect(hooksLensStore.registerCustomHook).toHaveBeenCalledTimes(1);
    expect(hooksLensStore.registerCustomHook).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "useComplianceFindings",
        description: "Fetch compliance findings for audit",
        fetchKey:
          "/api/compliance/findings?auditId=A-101&controlId=164.312(a)(2)",
        custom: true,
        route: "/dashboard",
      }),
    );
  });

  it("unregisters custom hook on cleanup", async () => {
    vi.stubEnv("NODE_ENV", "development");

    const nextNavigation = await import("next/navigation");
    vi.mocked(nextNavigation.usePathname).mockReturnValue("/settings");

    const { useHooksLens } = await import("../lib/hookslens/useHooksLens");
    const { hooksLensStore } = await import("@/lib/hookslens/store");

    useHooksLens({ name: "useAuditWorkspace" });
    cleanupEffect?.();

    expect(hooksLensStore.unregisterCustomHook).toHaveBeenCalledWith(
      "useAuditWorkspace",
      "/settings",
    );
  });

  it("is a no-op outside development", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const nextNavigation = await import("next/navigation");
    vi.mocked(nextNavigation.usePathname).mockReturnValue("/prod");

    const { useHooksLens } = await import("../lib/hookslens/useHooksLens");
    const { hooksLensStore } = await import("@/lib/hookslens/store");

    useHooksLens({ name: "useComplianceSummary" });

    expect(hooksLensStore.registerCustomHook).not.toHaveBeenCalled();
    expect(hooksLensStore.unregisterCustomHook).not.toHaveBeenCalled();
  });
});
