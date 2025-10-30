import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetPricingSignature, usePricingStore } from "@/lib/store/pricing";
import { calculatePricing } from "@/lib/pricing/engine";

const FEATURES = ["dimension", "option"] as const;

describe("pricing store", () => {
  beforeEach(() => {
    usePricingStore.setState({
      totals: null,
      optimistic: null,
      lastKnown: null,
      status: "idle",
      lastError: undefined,
    });
    resetPricingSignature();
  });

  it("stores server response on success", async () => {
    const pricing = calculatePricing({ features: [...FEATURES] });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ...pricing,
          traceId: "server-trace",
          generatedAt: new Date().toISOString(),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      ) as Response
    );

    await usePricingStore.getState().requestQuote([...FEATURES]);

    const state = usePricingStore.getState();
    expect(state.status).toBe("ready");
    expect(state.totals?.traceId).toBe("server-trace");
    expect(state.optimistic).toBeNull();
    expect(state.lastKnown).not.toBeNull();
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockRestore?.();
  });

  it("falls back to last known totals after retries", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("fail"));

    const promise = usePricingStore.getState().requestQuote([...FEATURES]);
    await vi.runAllTimersAsync();
    await promise;

    const state = usePricingStore.getState();
    expect(state.status).toBe("error");
    expect(state.totals).not.toBeNull();
    expect(state.lastError).toBeDefined();

    fetchMock.mockRestore();
    vi.useRealTimers();
  });
});
