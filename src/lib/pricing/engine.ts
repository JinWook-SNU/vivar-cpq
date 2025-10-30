import type { FeatureKey } from "@/lib/store/builder";
import {
  BASE_ROLE_DAYS,
  FEATURE_IMPACTS,
  MAX_K,
  MIN_K,
  MAINTENANCE_RATIO,
  OVERHEAD_RATE,
  ROLE_KEYS,
  ROLE_RATES,
  TECHNOLOGY_RATE,
  VAT_RATE,
} from "./rules";
import type { RoleKey } from "./rules";

export type PricingInput = {
  features: FeatureKey[];
  roleRates?: Partial<Record<RoleKey, number>>;
  k?: number;
};

export type PricingTrace = {
  included: FeatureKey[];
  k: number;
  labourDays: Record<RoleKey, number>;
};

export type FeatureCostBreakdown = {
  featureKey: FeatureKey;
  devDelta: number;
  maintDelta: number;
};

export type PricingTotals = {
  dev: number;
  maint: number;
  overhead: number;
  technology: number;
  vat: number;
  total: number;
  featureBreakdown: FeatureCostBreakdown[];
  trace: PricingTrace;
  traceId: string;
  generatedAt: string;
};

function clampK(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 1;
  }
  return Math.min(MAX_K, Math.max(MIN_K, value));
}

function resolveRates(overrides?: Partial<Record<RoleKey, number>>): Record<RoleKey, number> {
  const merged: Record<RoleKey, number> = { ...ROLE_RATES };
  if (overrides) {
    for (const key of ROLE_KEYS) {
      if (typeof overrides[key] === "number" && overrides[key]! > 0) {
        merged[key] = overrides[key]!;
      }
    }
  }
  return merged;
}

export function computeLabourDays(features: FeatureKey[]): Record<RoleKey, number> {
  const days: Record<RoleKey, number> = { ...BASE_ROLE_DAYS };
  features.forEach((feature) => {
    const impact = FEATURE_IMPACTS[feature];
    if (!impact) return;
    ROLE_KEYS.forEach((role) => {
      days[role] += impact[role] ?? 0;
    });
  });
  return days;
}

function labourCost(days: Record<RoleKey, number>, rates: Record<RoleKey, number>): number {
  return ROLE_KEYS.reduce((sum, role) => sum + days[role] * rates[role], 0);
}

function featureCost(feature: FeatureKey, rates: Record<RoleKey, number>, k: number): FeatureCostBreakdown {
  const impact = FEATURE_IMPACTS[feature];
  const devDelta = ROLE_KEYS.reduce((sum, role) => sum + (impact?.[role] ?? 0) * rates[role], 0) * k;
  const maintDelta = devDelta * MAINTENANCE_RATIO;
  return {
    featureKey: feature,
    devDelta: Math.round(devDelta),
    maintDelta: Math.round(maintDelta),
  };
}

export function calculatePricing(input: PricingInput): PricingTotals {
  const features = Array.from(new Set(input.features));
  const k = clampK(input.k);
  const rates = resolveRates(input.roleRates);
  const labourDays = computeLabourDays(features);
  const baseLabourCost = labourCost(labourDays, rates);
  const adjustedLabour = baseLabourCost * k;
  const overhead = adjustedLabour * OVERHEAD_RATE;
  const technology = (adjustedLabour + overhead) * TECHNOLOGY_RATE;
  const vat = (adjustedLabour + overhead + technology) * VAT_RATE;
  const maint = adjustedLabour * MAINTENANCE_RATIO;
  const total = adjustedLabour + overhead + technology + vat;

  const featureBreakdown = features.map((feature) => featureCost(feature, rates, k));

  const traceId = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

  return {
    dev: Math.round(adjustedLabour),
    maint: Math.round(maint),
    overhead: Math.round(overhead),
    technology: Math.round(technology),
    vat: Math.round(vat),
    total: Math.round(total),
    featureBreakdown,
    trace: {
      included: features,
      k,
      labourDays,
    },
    traceId,
    generatedAt: new Date().toISOString(),
  };
}
