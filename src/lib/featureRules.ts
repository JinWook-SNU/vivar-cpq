import type { FeatureKey } from "@/lib/store/builder";

export const requires: Partial<Record<FeatureKey, FeatureKey[]>> = {
  aiCatalog: ["aiSuggestions"],
  preset: ["option"],
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
  const next = { ...current };
  const autoEnabled: FeatureKey[] = [];
  const blocked: FeatureKey[] = [];
  let message: string | undefined;

  if (change.on === current[change.key]) {
    return { next: current, autoEnabled, blocked, message };
  }

  if (change.on) {
    const conflicting = (conflicts[change.key] || []).filter((c) => current[c]);
    if (conflicting.length) {
      blocked.push(change.key);
      return {
        next: current,
        autoEnabled,
        blocked,
        message: `Disable ${conflicting.join(", ")} before enabling ${change.key}.`,
      };
    }
    next[change.key] = true;
    (requires[change.key] || []).forEach((dep) => {
      if (!next[dep]) {
        next[dep] = true;
        autoEnabled.push(dep);
      }
    });
    message = autoEnabled.length ? `Enabled automatically: ${autoEnabled.join(", ")}` : undefined;
    return { next, autoEnabled, blocked, message };
  }

  const dependents = Object.entries(requires).reduce<FeatureKey[]>((acc, [feature, deps]) => {
    if ((deps || []).includes(change.key) && current[feature as FeatureKey]) {
      acc.push(feature as FeatureKey);
    }
    return acc;
  }, []);

  if (dependents.length) {
    blocked.push(change.key);
    return {
      next: current,
      autoEnabled,
      blocked,
      message: `Disable ${dependents.join(", ")} before turning off ${change.key}.`,
    };
  }

  next[change.key] = false;
  return { next, autoEnabled, blocked, message };
}
