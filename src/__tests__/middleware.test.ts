import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SWRHook } from "swr";

let cleanupEffect: (() => void) | undefined;

const storeMocks = {
  registerHook: vi.fn(),
  unregisterHook: vi.fn(),
  recordFetchStart: vi.fn(),
  recordFetchSuccess: vi.fn(),
  recordFetchError: vi.fn(),
  recordMutationStart: vi.fn(),
  recordMutationSuccess: vi.fn(),
  recordMutationError: vi.fn(),
};

const usePathnameMock = vi.fn();

vi.mock("react", () => ({
  useEffect: (effect: () => void | (() => void)) => {
    const cleanup = effect();
    cleanupEffect = typeof cleanup === "function" ? cleanup : undefined;
  },
  useRef: <T>(initial: T) => ({ current: initial }),
}));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
}));

vi.mock("@/lib/hookslens/store", () => ({
  hooksLensStore: storeMocks,
  FetchMethod: {},
}));

describe("hooksLensMiddleware", () => {
  beforeEach(() => {
    cleanupEffect = undefined;
    vi.clearAllMocks();
    usePathnameMock.mockReturnValue("/dashboard");
    vi.stubGlobal("window", {});
    vi.stubGlobal(
      "BroadcastChannel",
      class {
        postMessage = vi.fn();
        close = vi.fn();
        constructor(_name: string) {}
      },
    );
    vi.stubGlobal("performance", {
      now: vi
        .fn()
        .mockReturnValueOnce(10)
        .mockReturnValueOnce(34)
        .mockReturnValueOnce(100)
        .mockReturnValueOnce(135),
    });
  });

  afterEach(() => {
    cleanupEffect = undefined;
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("records the query lifecycle and forwards the wrapped fetcher", async () => {
    const { hooksLensMiddleware } = await import("../lib/hookslens/middleware");

    const wrappedFetcher = vi.fn(async () => ({ __status: 204 }));
    const mockUseSWRNext = vi.fn((key, fetcher, config) => ({
      key,
      fetcher,
      config,
    }));
    const useSWRNext = mockUseSWRNext as unknown as SWRHook;

    const result = hooksLensMiddleware(useSWRNext)(
      ["/api/compliance/findings", { auditId: "A-101" }],
      wrappedFetcher,
      { refreshInterval: 15000 },
    );

    expect(result).toEqual(
      expect.objectContaining({
        key: ["/api/compliance/findings", { auditId: "A-101" }],
        fetcher: expect.any(Function),
        config: { refreshInterval: 15000 },
      }),
    );

    const fetcher = mockUseSWRNext.mock.calls[0]?.[1] as (
      ...args: unknown[]
    ) => Promise<unknown>;
    await expect(
      fetcher(["/api/compliance/findings", { auditId: "A-101" }]),
    ).resolves.toEqual({
      __status: 204,
    });

    expect(storeMocks.registerHook).toHaveBeenCalledWith(
      '["/api/compliance/findings",{"auditId":"A-101"}]',
      "query",
      15000,
      "/dashboard",
    );
    expect(storeMocks.recordFetchStart).toHaveBeenCalledWith(
      '["/api/compliance/findings",{"auditId":"A-101"}]',
      "/dashboard",
      "/api/compliance/findings",
    );
    expect(storeMocks.recordFetchSuccess).toHaveBeenCalledWith(
      '["/api/compliance/findings",{"auditId":"A-101"}]',
      24,
      "/dashboard",
      204,
    );
  });

  it("records mutation failures with normalized status codes", async () => {
    const { hooksLensMiddleware } = await import("../lib/hookslens/middleware");

    const mockUseSWRNext = vi.fn((key, fetcher, config) => ({
      key,
      fetcher,
      config,
    }));
    const useSWRNext = mockUseSWRNext as unknown as SWRHook;
    const wrappedFetcher = vi.fn(async () => {
      throw { response: { status: 422 } };
    });

    hooksLensMiddleware(useSWRNext)(
      "/api/compliance/remediation-plan",
      wrappedFetcher,
      {
        _isHook: false,
      } as never,
    );

    const fetcher = mockUseSWRNext.mock.calls[0]?.[1] as (
      ...args: unknown[]
    ) => Promise<unknown>;

    await expect(fetcher("/api/compliance/remediation-plan")).rejects.toEqual({
      response: { status: 422 },
    });

    expect(storeMocks.registerHook).toHaveBeenCalledWith(
      "/api/compliance/remediation-plan",
      "mutation",
      undefined,
      "/dashboard",
    );
    expect(storeMocks.recordMutationStart).toHaveBeenCalledWith(
      "/api/compliance/remediation-plan",
      "/dashboard",
      "/api/compliance/remediation-plan",
    );
    expect(storeMocks.recordMutationError).toHaveBeenCalledWith(
      "/api/compliance/remediation-plan",
      24,
      "/dashboard",
      422,
    );
  });

  it("unregisters the hook when the effect cleans up", async () => {
    const { hooksLensMiddleware } = await import("../lib/hookslens/middleware");

    const mockUseSWRNext = vi.fn((key, fetcher, config) => ({
      key,
      fetcher,
      config,
    }));
    const useSWRNext = mockUseSWRNext as unknown as SWRHook;

    hooksLensMiddleware(useSWRNext)("/api/compliance/findings", null, {});

    cleanupEffect?.();

    expect(storeMocks.unregisterHook).toHaveBeenCalledWith(
      "/api/compliance/findings",
      "/dashboard",
    );
  });
});
