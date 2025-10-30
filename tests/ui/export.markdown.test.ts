import { describe, it, expect } from "vitest";
import { buildEstimateMarkdown } from "@/lib/export/markdown";
import { calculatePricing } from "@/lib/pricing/engine";
import type { PricingSnapshot } from "@/lib/store/pricing";
import type { FeatureKey } from "@/lib/store/builder";

const SAMPLE_FEATURES: FeatureKey[] = ["color", "option", "preset"];

function createSnapshot(features: FeatureKey[], source: PricingSnapshot["source"]): PricingSnapshot {
  const totals = calculatePricing({ features });
  return {
    ...totals,
    source,
  } as PricingSnapshot;
}

describe("buildEstimateMarkdown", () => {
  it("summarises totals, features, and performance cues", () => {
    const snapshot = createSnapshot(SAMPLE_FEATURES, "server");
    const markdown = buildEstimateMarkdown({
      estimate: snapshot,
      features: SAMPLE_FEATURES,
      presetId: "sport",
      colorHex: "#ff6b6b",
      options: { spoiler: true, roofRack: false },
      latencyP95: 312,
      fps: 62,
    });

    expect(markdown).toContain("# Configurator Estimate");
    expect(markdown).toContain("sport");
    expect(markdown).toContain("Spoiler: Enabled");
    expect(markdown).toMatch(/Total \| ₩[0-9,]+/);
    expect(markdown).toContain("Pricing latency P95: 312 ms");
    expect(markdown).toContain(snapshot.traceId);
  });

  it("handles empty feature and option sets", () => {
    const snapshot = createSnapshot([], "optimistic");
    const markdown = buildEstimateMarkdown({
      estimate: snapshot,
      features: [],
      presetId: null,
      colorHex: "#f5f5f5",
      options: {},
      latencyP95: 0,
      fps: 60,
    });

    expect(markdown).toContain("Active preset: None");
    expect(markdown).toContain("- (none)");
    expect(markdown).toContain("Source: Optimistic (in-progress)");
  });
});
