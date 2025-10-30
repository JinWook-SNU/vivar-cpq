import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import EstimatePanel from "@/components/cpq/EstimatePanel";
import { useBuilderStore, type FeatureKey } from "@/lib/store/builder";
import { resetPricingSignature, usePricingStore } from "@/lib/store/pricing";
import { calculatePricing } from "@/lib/pricing/engine";

const fpsMock = vi.fn(() => 60);
const latencyP95Mock = vi.fn(() => 120);

vi.mock("@/lib/metrics/fps", () => ({
  useFps: () => fpsMock(),
  ensureFpsSampler: vi.fn(),
}));

vi.mock("@/lib/metrics/latency", () => ({
  useLatencyP95: () => latencyP95Mock(),
  recordLatency: vi.fn(),
}));

describe("EstimatePanel pricing updates", () => {
  const originalFetch = global.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;

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
    resetPricingSignature();
    fetchMock = vi.fn();
    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
    fpsMock.mockReturnValue(60);
    latencyP95Mock.mockReturnValue(120);
  });

  afterEach(() => {
    (global as unknown as { fetch: typeof fetch }).fetch = originalFetch;
    vi.restoreAllMocks();
  });

  const createDelayedResponse = (payload: ReturnType<typeof calculatePricing>, delay: number) =>
    (_input: RequestInfo, init?: RequestInit) =>
      new Promise<Response>((resolve, reject) => {
        const timer = setTimeout(() => {
          resolve(
            new Response(JSON.stringify(payload), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        }, delay);

        init?.signal?.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new DOMException("Aborted", "AbortError"));
        });
      });

  it("shows optimistic totals instantly while waiting for server response", async () => {
    const features: FeatureKey[] = ["dimension"];
    act(() => {
      useBuilderStore.getState().setToggle("dimension", true);
    });

    const serverPayload = calculatePricing({ features });
    fetchMock.mockImplementation(createDelayedResponse(serverPayload, 120));

    await act(async () => {
      render(<EstimatePanel />);
    });

    await waitFor(() => expect(usePricingStore.getState().optimistic).not.toBeNull());
    await waitFor(() => expect(screen.getByText(/Source:/i).textContent).toMatch(/Optimistic/i));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 140));
    });

    await waitFor(() => expect(screen.getByText(/Source:/i).textContent).toMatch(/Server/i));
  });

  it("ignores slower responses from stale requests", async () => {
    const firstFeatures: FeatureKey[] = ["dimension"];
    const secondFeatures: FeatureKey[] = ["dimension", "preset"];

    const firstPayload = calculatePricing({ features: firstFeatures });
    const secondPayload = calculatePricing({ features: secondFeatures });

    fetchMock = vi
      .fn()
      .mockImplementationOnce(createDelayedResponse(firstPayload, 200))
      .mockImplementationOnce(createDelayedResponse(secondPayload, 0));

    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    act(() => {
      useBuilderStore.getState().setToggle("dimension", true);
    });

    await act(async () => {
      render(<EstimatePanel />);
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    act(() => {
      useBuilderStore.getState().setToggle("preset", true);
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 220));
    });

    await waitFor(() => expect(screen.getByText(/Source:/i).textContent).toMatch(/Server/i));

    const breakdownButton = screen.getByRole("button", { name: /view breakdown/i });
    await act(async () => {
      breakdownButton.click();
    });

    await waitFor(() =>
      expect(
        screen.getByText((content) => content.includes("Features: dimension, preset"))
      ).toBeInTheDocument()
    );
  });
});
