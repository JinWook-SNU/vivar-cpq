import { create } from "zustand";
import { useBuilderStore } from "@/lib/store/builder";
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

let retryDelays = [1000, 2000, 4000];
let lastSignature: string | null = null;

export function setPricingRetryDelays(delays: number[]) {
  retryDelays = delays;
}

export function resetPricingSignature() {
  lastSignature = null;
}

function getRetryDelays() {
  return retryDelays;
}

function buildSignature(features: FeatureKey[]): string {
  const state = useBuilderStore.getState();
  const sortedFeatures = [...new Set(features)].sort().join("|");
  const preset = state.activePresetId ?? "none";
  const color = state.params.color?.hex?.toLowerCase() ?? "default";
  const optionEntries = Object.entries(state.params.options ?? {})
    .map(([key, value]) => `${key}:${value ? 1 : 0}`)
    .sort()
    .join(",");
  return `${sortedFeatures}::${preset}::${color}::${optionEntries}`;
}

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

export const usePricingStore = create<PricingState>((set) => {
  let activeController: AbortController | null = null;
  let activeToken: symbol | null = null;

  return {
    totals: null,
    optimistic: null,
    lastKnown: null,
    status: "idle",
    async requestQuote(features) {
      const uniqueFeatures = Array.from(new Set(features));
      const signature = buildSignature(uniqueFeatures);
      if (signature === lastSignature) {
        return;
      }
      lastSignature = signature;
      const optimistic = normalizePricing(
        calculatePricing({ features: uniqueFeatures }),
        "optimistic"
      );

      set({
        optimistic,
        status: "fetching",
        lastError: undefined,
      });

      activeController?.abort();
      const controller = new AbortController();
      activeController = controller;
      const token = Symbol("pricing-request");
      activeToken = token;

      const start = typeof performance !== "undefined" ? performance.now() : Date.now();

      try {
        let attempt = 0;
        let pricing: PricingTotals | null = null;

        const delays = getRetryDelays();
        while (attempt <= delays.length) {
          try {
            pricing = await fetchPricing(uniqueFeatures, controller.signal);
            break;
          } catch (error) {
            if (controller.signal.aborted || activeToken !== token) {
              return;
            }
            if (attempt === delays.length) {
              throw error;
            }
            const delay = delays[attempt] ?? 0;
            await new Promise((resolve) => setTimeout(resolve, delay));
            attempt += 1;
          }
        }

        if (!pricing) {
          throw new Error("Pricing fetch failed");
        }

        if (activeToken !== token) {
          return;
        }

        const end = typeof performance !== "undefined" ? performance.now() : Date.now();
        recordLatency(end - start);
        const snapshot = normalizePricing(pricing, "server");
        set({
          totals: snapshot,
          optimistic: null,
          lastKnown: snapshot,
          status: "ready",
          lastError: undefined,
        });
      } catch (error) {
        if (controller.signal.aborted || activeToken !== token) {
          return;
        }
        set(({ lastKnown }) => ({
          status: "error",
          lastError: error instanceof Error ? error.message : "Unknown error",
          optimistic: null,
          totals: lastKnown ?? optimistic,
        }));
        lastSignature = null;
      } finally {
        if (activeToken === token) {
          controller.abort();
          activeController = null;
          activeToken = null;
        }
      }
    },
  };
});
