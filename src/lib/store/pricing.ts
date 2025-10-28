import { create } from "zustand";
import type { FeatureKey } from "@/lib/store/builder";
import { calculatePricing, type PricingTotals } from "@/lib/pricing/engine";
import { recordLatency } from "@/lib/metrics/latency";

export type PricingSnapshot = ReturnType<typeof normalizePricing>;

function normalizePricing(pricing: PricingTotals, source: "optimistic" | "server") {
  return {
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
    source,
  };
}

const RETRY_DELAYS = [1000, 2000, 4000];

type PricingState = {
  totals: PricingSnapshot | null;
  optimistic: PricingSnapshot | null;
  lastKnown: PricingSnapshot | null;
  status: "idle" | "fetching" | "ready" | "error";
  lastError?: string;
  requestQuote: (features: FeatureKey[]) => Promise<void>;
};

async function fetchPricing(features: FeatureKey[], signal: AbortSignal) {
  const response = await fetch("/api/pricing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ features }),
    signal,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error?.message || `Request failed with ${response.status}`);
  }
  return (await response.json()) as PricingTotals;
}

export const usePricingStore = create<PricingState>((set, get) => ({
  totals: null,
  optimistic: null,
  lastKnown: null,
  status: "idle",
  async requestQuote(features) {
    const uniqueFeatures = Array.from(new Set(features));
    const optimistic = normalizePricing(
      calculatePricing({ features: uniqueFeatures }),
      "optimistic"
    );

    set({
      optimistic,
      status: "fetching",
      lastError: undefined,
    });

    const controller = new AbortController();
    const start = performance.now();

    try {
      let attempt = 0;
      let pricing: PricingTotals | null = null;

      while (attempt <= RETRY_DELAYS.length) {
        try {
          pricing = await fetchPricing(uniqueFeatures, controller.signal);
          break;
        } catch (error) {
          if (attempt === RETRY_DELAYS.length) {
            throw error;
          }
          const delay = RETRY_DELAYS[attempt];
          await new Promise((resolve) => setTimeout(resolve, delay));
          attempt += 1;
        }
      }

      if (!pricing) {
        throw new Error("Pricing fetch failed");
      }

      recordLatency(performance.now() - start);
      const snapshot = normalizePricing(pricing, "server");
      set({
        totals: snapshot,
        optimistic: null,
        lastKnown: snapshot,
        status: "ready",
        lastError: undefined,
      });
    } catch (error) {
      set(({ lastKnown }) => ({
        status: "error",
        lastError: error instanceof Error ? error.message : "Unknown error",
        optimistic: null,
        totals: lastKnown ?? optimistic,
      }));
    } finally {
      controller.abort();
    }
  },
}));
