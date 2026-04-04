import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/hookslens/store", () => ({
  hooksLensStore: {
    recordExternalFetchStart: vi.fn(),
    recordExternalFetchDone: vi.fn(),
  },
}));

describe("fetchObserver", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "development");
    vi.stubGlobal("crypto", { randomUUID: vi.fn(() => "fetch-id") });
    vi.stubGlobal("performance", {
      now: vi
        .fn()
        .mockReturnValueOnce(10)
        .mockReturnValueOnce(50)
        .mockReturnValue(50),
    });

    (globalThis as any).window = {
      location: { pathname: "/compliance/audits/A-101" },
      fetch: vi.fn(),
    };
  });

  it("wraps fetch and records successful external fetch lifecycle", async () => {
    const { installFetchObserver } =
      await import("../lib/hookslens/fetchObserver");
    const { hooksLensStore } = await import("@/lib/hookslens/store");

    const startSpy = vi.spyOn(hooksLensStore, "recordExternalFetchStart");
    const doneSpy = vi.spyOn(hooksLensStore, "recordExternalFetchDone");

    const response = new Response("{}", { status: 201 });
    (window.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      response,
    );

    installFetchObserver();

    const result = await window.fetch("/api/compliance/findings", {
      method: "post",
    });

    expect(result).toBe(response);
    expect(startSpy).toHaveBeenCalledWith(
      "/api/compliance/findings",
      "POST",
      "/compliance/audits/A-101",
      "fetch-id",
    );
    expect(doneSpy).toHaveBeenCalledWith(
      "fetch-id",
      40,
      201,
      "/compliance/audits/A-101",
      "/api/compliance/findings",
    );
  });

  it("records failed external fetch with status 0", async () => {
    const { installFetchObserver } =
      await import("../lib/hookslens/fetchObserver");
    const { hooksLensStore } = await import("@/lib/hookslens/store");

    const doneSpy = vi.spyOn(hooksLensStore, "recordExternalFetchDone");
    (window.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("network down"),
    );

    installFetchObserver();

    await expect(window.fetch("/api/compliance/evidence")).rejects.toThrow(
      "network down",
    );

    expect(doneSpy).toHaveBeenCalledWith(
      "fetch-id",
      40,
      0,
      "/compliance/audits/A-101",
      "/api/compliance/evidence",
    );
  });

  it("does not install outside development", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const { installFetchObserver } =
      await import("../lib/hookslens/fetchObserver");
    const originalFetch = window.fetch;

    installFetchObserver();

    expect(window.fetch).toBe(originalFetch);
  });
});
