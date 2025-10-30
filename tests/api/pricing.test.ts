import { describe, expect, it } from "vitest";
import { calculatePricing, computeLabourDays } from "@/lib/pricing/engine";
import { POST } from "@/app/api/pricing/route";
import type { FeatureKey } from "@/lib/store/builder";

const SAMPLE_FEATURES: FeatureKey[] = ["option", "preset", "aiCatalog", "aiSuggestions"];

describe("pricing engine", () => {
  it("computes labour day aggregation", () => {
    const labourDays = computeLabourDays(SAMPLE_FEATURES);
    expect(labourDays.planner).toBeCloseTo(2.6, 5);
    expect(labourDays.designer).toBeCloseTo(3.2, 5);
    expect(labourDays.fe).toBeCloseTo(3.7, 5);
    expect(labourDays.three).toBeCloseTo(2.2, 5);
    expect(labourDays.ai).toBeCloseTo(1.1, 5);
  });

  it("returns cost breakdown matching pricing rules example", () => {
    const result = calculatePricing({ features: SAMPLE_FEATURES });
    expect(result.dev).toBe(3_840_000);
    expect(result.overhead).toBe(384_000);
    expect(result.technology).toBe(844_800);
    expect(result.vat).toBe(506_880);
    expect(result.total).toBe(5_575_680);
    expect(result.maint).toBe(384_000);
    expect(result.featureBreakdown).toHaveLength(SAMPLE_FEATURES.length);
    expect(result.trace.included).toEqual(SAMPLE_FEATURES);
    expect(typeof result.traceId).toBe("string");
    expect(new Date(result.generatedAt).toString()).not.toBe("Invalid Date");
  });

  it("clamps k factor and applies role rate overrides", () => {
    const result = calculatePricing({
      features: ["dimension"],
      k: 2,
      roleRates: { planner: 400_000 },
    });
    expect(result.trace.k).toBeCloseTo(1.5);
    expect(result.dev).toBeGreaterThan(0);
    expect(result.trace.included).toEqual(["dimension"]);
  });
});

describe("pricing API", () => {
  it("responds with totals for valid payload", async () => {
    const request = new Request("http://localhost/api/pricing", {
      method: "POST",
      body: JSON.stringify({ features: ["dimension", "option"] }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.dev).toBeGreaterThan(0);
    expect(Array.isArray(json.featureBreakdown)).toBe(true);
    expect(json.trace.included).toEqual(["dimension", "option"]);
  });

  it("rejects invalid payload", async () => {
    const request = new Request("http://localhost/api/pricing", {
      method: "POST",
      body: "not-json",
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
