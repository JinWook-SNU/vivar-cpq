import type { ConfiguratorBlueprint } from "@/lib/store/builder";

const KEY = "cpq-blueprint-v1";

export function toBlueprint(
  featureToggles: ConfiguratorBlueprint["featureToggles"],
  featureParams: ConfiguratorBlueprint["featureParams"],
  presetId: ConfiguratorBlueprint["presetId"] = null
): ConfiguratorBlueprint {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    featureToggles,
    featureParams,
    presetId,
  };
}

export function saveBlueprint(bp: ConfiguratorBlueprint) {
  try {
    localStorage.setItem(KEY, JSON.stringify(bp));
  } catch {
    // ignore (SSR or no storage)
  }
}

export function loadBlueprint(): ConfiguratorBlueprint | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.version !== 1) return null; // future: migrate
    return data as ConfiguratorBlueprint;
  } catch {
    return null;
  }
}
