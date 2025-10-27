import type { FeatureKey } from "@/lib/store/builder";

export const requires: Partial<Record<FeatureKey, FeatureKey[]>> = {
  aiCatalog: ["aiSuggestions"],
};

export const conflicts: Partial<Record<FeatureKey, FeatureKey[]>> = {
  // 예시: fullscreen: ["embeddedMode"],
};

export type GuardResult = {
  next: Record<FeatureKey, boolean>;
  autoEnabled: FeatureKey[];
  blocked: FeatureKey[];
  message?: string;
};

export function applyRules(
  current: Record<FeatureKey, boolean>,
  change: { key: FeatureKey; on: boolean }
): GuardResult {
  const next = { ...current, [change.key]: change.on };
  const autoEnabled: FeatureKey[] = [];
  const blocked: FeatureKey[] = [];

  if (change.on) {
    (requires[change.key] || []).forEach((dep) => {
      if (!next[dep]) { next[dep] = true; autoEnabled.push(dep); }
    });
    (conflicts[change.key] || []).forEach((c) => {
      if (next[c]) { next[change.key] = false; blocked.push(change.key); }
    });
  }

  return {
    next,
    autoEnabled,
    blocked,
    message: blocked.length
      ? `Cannot enable ${change.key} due to conflict.`
      : autoEnabled.length
      ? `Enabled automatically: ${autoEnabled.join(", ")}`
      : undefined,
  };
}
