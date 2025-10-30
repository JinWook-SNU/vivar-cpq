import { Buffer } from "buffer";
import {
  DEFAULT_COLOR,
  DEFAULT_OPTIONS,
  DEFAULT_ENVIRONMENT,
  type ConfiguratorBlueprint,
  type FeatureKey,
} from "@/lib/store/builder";
import { applyRules } from "@/lib/featureRules";

const KEY = "cpq-blueprint-v1";

type BlueprintInput = {
  featureToggles: ConfiguratorBlueprint["featureToggles"];
  featureParams: ConfiguratorBlueprint["featureParams"];
  presetId?: ConfiguratorBlueprint["presetId"];
  environment?: ConfiguratorBlueprint["environment"];
  createdAt?: string;
};

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

function createBlueprint({
  featureToggles,
  featureParams,
  presetId = null,
  environment = DEFAULT_ENVIRONMENT,
  createdAt,
}: BlueprintInput): ConfiguratorBlueprint {
  const colorHex = featureParams.color?.hex ?? DEFAULT_COLOR;
  const options = {
    ...DEFAULT_OPTIONS,
    ...(featureParams.options ?? {}),
  };

  return {
    version: 1,
    createdAt: createdAt ?? new Date().toISOString(),
    featureToggles: normalizeToggles(featureToggles),
    featureParams: {
      ...featureParams,
      color: { hex: colorHex },
      options,
    },
    presetId,
    environment: {
      backgroundColor: environment?.backgroundColor ?? DEFAULT_ENVIRONMENT.backgroundColor,
    },
  };
}

export function toBlueprint(
  featureToggles: ConfiguratorBlueprint["featureToggles"],
  featureParams: ConfiguratorBlueprint["featureParams"],
  presetId: ConfiguratorBlueprint["presetId"] = null,
  environment: ConfiguratorBlueprint["environment"] = DEFAULT_ENVIRONMENT,
  createdAt?: string
): ConfiguratorBlueprint {
  return createBlueprint({ featureToggles, featureParams, presetId, environment, createdAt });
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
    return createBlueprint({
      featureToggles: blueprint.featureToggles,
      featureParams: blueprint.featureParams,
      presetId: blueprint.presetId,
      environment: blueprint.environment,
      createdAt: blueprint.createdAt,
    });
  } catch {
    return null;
  }
}

function toBase64Url(payload: string) {
  if (typeof window === "undefined") {
    return Buffer.from(payload, "utf-8").toString("base64url");
  }
  const base64 = window.btoa(unescape(encodeURIComponent(payload)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function fromBase64Url(token: string) {
  const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "===".slice((normalized.length + 3) % 4);
  try {
    if (typeof window === "undefined") {
      return Buffer.from(padded, "base64").toString("utf-8");
    }
    return decodeURIComponent(escape(window.atob(padded)));
  } catch {
    return null;
  }
}

export function encodeBlueprint(blueprint: ConfiguratorBlueprint): string {
  return toBase64Url(JSON.stringify(blueprint));
}

export function decodeBlueprint(token: string): ConfiguratorBlueprint | null {
  const json = fromBase64Url(token);
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as ConfiguratorBlueprint;
    if (parsed?.version !== 1) return null;
    return createBlueprint({
      featureToggles: parsed.featureToggles,
      featureParams: parsed.featureParams,
      presetId: parsed.presetId,
      environment: parsed.environment,
      createdAt: parsed.createdAt,
    });
  } catch {
    return null;
  }
}
