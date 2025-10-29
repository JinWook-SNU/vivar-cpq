import {
  DEFAULT_COLOR,
  DEFAULT_OPTIONS,
  DEFAULT_ENVIRONMENT,
  type ConfiguratorBlueprint,
  type FeatureKey,
} from "@/lib/store/builder";
import { applyRules } from "@/lib/featureRules";

const KEY = "cpq-blueprint-v1";

function normalizeToggles(toggles: ConfiguratorBlueprint["featureToggles"]) {
  const orderedKeys: FeatureKey[] = [
    "dimension",
    "fullscreen",
    "screenshot",
    "ar",
    "color",
    "option",
    "preset",
    "aiSuggestions",
    "aiCatalog",
  ];

  let current: Record<FeatureKey, boolean> = {
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

  for (const key of orderedKeys) {
    const nextState = applyRules(current, { key, on: Boolean(toggles[key]) });
    current = nextState.next;
  }

  return current;
}

export function toBlueprint(
  featureToggles: ConfiguratorBlueprint["featureToggles"],
  featureParams: ConfiguratorBlueprint["featureParams"],
  presetId: ConfiguratorBlueprint["presetId"] = null,
  environment: ConfiguratorBlueprint["environment"] = DEFAULT_ENVIRONMENT
): ConfiguratorBlueprint {
  const colorHex = featureParams.color?.hex ?? DEFAULT_COLOR;
  const options = {
    ...DEFAULT_OPTIONS,
    ...(featureParams.options ?? {}),
  };
  const normalizedEnvironment = {
    backgroundColor: environment?.backgroundColor ?? DEFAULT_ENVIRONMENT.backgroundColor,
  };

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    featureToggles: normalizeToggles(featureToggles),
    featureParams: {
      ...featureParams,
      color: { hex: colorHex },
      options,
    },
    presetId: presetId ?? null,
    environment: normalizedEnvironment,
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
    const blueprint = data as ConfiguratorBlueprint;
    const environment = {
      backgroundColor:
        blueprint.environment?.backgroundColor ?? DEFAULT_ENVIRONMENT.backgroundColor,
    };
    return {
      ...blueprint,
      environment,
    };
  } catch {
    return null;
  }
}
