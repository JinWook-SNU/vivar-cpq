import type { FeatureKey } from "@/lib/store/builder";

export type RoleKey = "planner" | "designer" | "fe" | "three" | "ai";

export const ROLE_KEYS: RoleKey[] = ["planner", "designer", "fe", "three", "ai"];

export const BASE_ROLE_DAYS: Record<RoleKey, number> = {
  planner: 2,
  designer: 2,
  fe: 2,
  three: 2,
  ai: 0.4,
};

export const ROLE_RATES: Record<RoleKey, number> = {
  planner: 300_000,
  designer: 300_000,
  fe: 300_000,
  three: 300_000,
  ai: 300_000,
};

export const FEATURE_IMPACTS: Record<FeatureKey, Record<RoleKey, number>> = {
  dimension: { planner: 0.1, designer: 0.2, fe: 0.3, three: 0.2, ai: 0 },
  ar: { planner: 0.1, designer: 0.2, fe: 0.2, three: 0.4, ai: 0 },
  fullscreen: { planner: 0, designer: 0.1, fe: 0.3, three: 0, ai: 0 },
  screenshot: { planner: 0, designer: 0.2, fe: 0.4, three: 0, ai: 0 },
  color: { planner: 0.1, designer: 0.2, fe: 0.4, three: 0, ai: 0 },
  option: { planner: 0.2, designer: 0.3, fe: 0.5, three: 0, ai: 0 },
  preset: { planner: 0.2, designer: 0.4, fe: 0.6, three: 0, ai: 0 },
  aiSuggestions: { planner: 0.1, designer: 0.2, fe: 0.3, three: 0, ai: 0.3 },
  aiCatalog: { planner: 0.1, designer: 0.3, fe: 0.3, three: 0.2, ai: 0.4 },
};

export const DEFAULT_K = 1;
export const MIN_K = 0.8;
export const MAX_K = 1.5;

export const OVERHEAD_RATE = 0.1; // 10%
export const TECHNOLOGY_RATE = 0.2; // 20%
export const VAT_RATE = 0.1; // 10%
export const MAINTENANCE_RATIO = 0.1; // monthly maintenance assumed 10% of labour cost
