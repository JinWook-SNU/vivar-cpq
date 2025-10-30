import { applyRules } from "@/lib/featureRules";
import type { FeatureKey } from "@/lib/store/builder";

const base = {
  dimension: false,
  ar: false,
  fullscreen: false,
  screenshot: false,
  color: false,
  option: false,
  preset: false,
  aiSuggestions: false,
  aiCatalog: false,
} satisfies Record<FeatureKey, boolean>;

test("aiCatalog enables aiSuggestions", () => {
  const r = applyRules(base, { key: "aiCatalog", on: true });
  expect(r.next.aiSuggestions).toBe(true);
  expect(r.autoEnabled).toContain("aiSuggestions");
});

test("cannot disable aiSuggestions while aiCatalog is active", () => {
  const enabled = applyRules(base, { key: "aiCatalog", on: true });
  const result = applyRules(enabled.next, { key: "aiSuggestions", on: false });
  expect(result.next.aiSuggestions).toBe(true);
  expect(result.blocked).toContain("aiSuggestions");
  expect(result.message).toMatch(/aiCatalog/i);
});
