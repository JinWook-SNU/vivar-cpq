import { applyRules } from "@/lib/featureRules";
import type { FeatureKey } from "@/lib/store/builder";

export type VisibleModules = {
  utilities: {
    dimension: boolean;
    fullscreen: boolean;
    screenshot: boolean;
    ar: boolean;
  };
  panels: {
    color: boolean;
    options: boolean;
    presets: boolean;
    aiSuggestions: boolean;
    aiCatalog: boolean;
  };
};

const utilKeys: FeatureKey[] = ["dimension", "fullscreen", "screenshot", "ar"];
const panelKeys: FeatureKey[] = ["color", "option", "preset", "aiSuggestions", "aiCatalog"];

function toFeatureKey(key: string): key is FeatureKey {
  return [...utilKeys, ...panelKeys].includes(key as FeatureKey);
}

function normalize(toggles: Record<string, boolean>): Record<FeatureKey, boolean> {
  const result: Record<FeatureKey, boolean> = {
    dimension: false,
    fullscreen: false,
    screenshot: false,
    ar: false,
    color: false,
    option: false,
    preset: false,
    aiSuggestions: false,
    aiCatalog: false,
  };

  for (const [rawKey, rawValue] of Object.entries(toggles)) {
    if (!toFeatureKey(rawKey)) continue;
    const current = result[rawKey];
    if (typeof rawValue !== "boolean" || rawValue === current) {
      result[rawKey] = current;
    } else {
      const next = applyRules(result, { key: rawKey, on: rawValue });
      Object.assign(result, next.next);
    }
  }

  return result;
}

export function composeVisible(toggles: Record<string, boolean>): VisibleModules {
  const state = normalize(toggles);
  return {
    utilities: {
      dimension: state.dimension,
      fullscreen: state.fullscreen,
      screenshot: state.screenshot,
      ar: state.ar,
    },
    panels: {
      color: state.color,
      options: state.option,
      presets: state.preset,
      aiSuggestions: state.aiSuggestions,
      aiCatalog: state.aiCatalog,
    },
  };
}

export function getTestIds(visible: VisibleModules): string[] {
  const ids: string[] = [];
  if (visible.panels.color) ids.push("panel-product-color");
  if (visible.utilities.dimension) ids.push("dimension-hud");
  if (visible.utilities.fullscreen) ids.push("fullscreen-button");
  if (visible.utilities.screenshot) ids.push("screenshot-button");
  if (visible.utilities.ar) ids.push("ar-button");
  if (visible.panels.options) ids.push("option-panel");
  if (visible.panels.presets) ids.push("preset-bar");
  if (visible.panels.aiSuggestions) ids.push("ai-suggestions-chips");
  if (visible.panels.aiCatalog) ids.push("ai-catalog-card");
  return ids;
}
