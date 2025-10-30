import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import EstimatePanel from "@/components/cpq/EstimatePanel";
import { useBuilderStore } from "@/lib/store/builder";
import { usePricingStore, setPricingRetryDelays } from "@/lib/store/pricing";
import { calculatePricing } from "@/lib/pricing/engine";

const fpsMock = vi.fn(() => 60);
const latencyMock = vi.fn(() => 120);

vi.mock("@/lib/metrics/fps", () => ({
  useFps: () => fpsMock(),
  ensureFpsSampler: vi.fn(),
}));

vi.mock("@/lib/metrics/latency", () => ({
  useLatencyP95: () => latencyMock(),
  recordLatency: vi.fn(),
}));

describe("EstimatePanel metrics resilience", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    useBuilderStore.getState().reset();
    usePricingStore.setState((state) => ({
      ...state,
      totals: null,
      optimistic: null,
      lastKnown: null,
      status: "idle",
      lastError: undefined,
    }));
    fpsMock.mockReturnValue(60);
    latencyMock.mockReturnValue(120);
    (global as unknown as { fetch: unknown }).fetch = vi.fn();
    setPricingRetryDelays([0]);
  });

  afterEach(() => {
    (global as unknown as { fetch: unknown }).fetch = originalFetch;
    vi.restoreAllMocks();
    setPricingRetryDelays([1000, 2000, 4000]);
  });

  it("renders a toast when latency threshold is breached", async () => {
    const pricing = calculatePricing({ features: [] });
    const snapshot = {
      dev: pricing.dev,
      maint: pricing.maint,
      overhead: pricing.overhead,
      technology: pricing.technology,
      vat: pricing.vat,
      total: pricing.total,
      featureBreakdown: pricing.featureBreakdown,
      trace: pricing.trace,
      traceId: pricing.traceId,
      generatedAt: pricing.generatedAt,
      source: "server" as const,
    };

    usePricingStore.setState((state) => ({
      ...state,
      totals: snapshot,
      lastKnown: snapshot,
      status: "ready",
    }));

    latencyMock.mockReturnValue(650);

    render(<EstimatePanel />);

    await waitFor(() =>
      expect(screen.getByText(/Latency exceeds 500 ms target/i)).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(
        screen.getByRole("alert")
      ).toHaveTextContent(/Pricing latency P95 exceeded 500 ms. Showing cached totals./i)
    );
  });

  it("falls back to last known totals and surfaces error message", async () => {
    const pricing = calculatePricing({ features: ["dimension"] });
    const snapshot = {
      dev: pricing.dev,
      maint: pricing.maint,
      overhead: pricing.overhead,
      technology: pricing.technology,
      vat: pricing.vat,
      total: pricing.total,
      featureBreakdown: pricing.featureBreakdown,
      trace: pricing.trace,
      traceId: pricing.traceId,
      generatedAt: pricing.generatedAt,
      source: "server" as const,
    };

    usePricingStore.setState((state) => ({
      ...state,
      totals: snapshot,
      lastKnown: snapshot,
      status: "ready",
    }));

    const fetchMock = vi.fn(() => Promise.reject(new Error("Server unavailable")));
    (global as unknown as { fetch: unknown }).fetch = fetchMock;

    act(() => {
      useBuilderStore.getState().setToggle("dimension", true);
    });

    render(<EstimatePanel />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByText(/Fallback to last known total/i)).toBeInTheDocument()
    );
  });
});
