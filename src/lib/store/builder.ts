import { create } from "zustand";

export type FeatureKey =
  | "dimension" | "ar" | "fullscreen" | "screenshot"
  | "color" | "option" | "preset"
  | "aiSuggestions" | "aiCatalog";

export type FeatureParams = Partial<{
  screenshot: { resolution: "1x" | "2x" };
  ar: { assetUrl?: string };
  color: { palette?: string[] };
}>;

export type ConfiguratorBlueprint = {
  version: 1;
  createdAt: string;
  featureToggles: Record<FeatureKey, boolean>;
  featureParams: FeatureParams;
  presetId?: string | null;
};

const DEFAULT_TOGGLES: Record<FeatureKey, boolean> = {
  dimension: false,
  ar: false,
  fullscreen: false,
  screenshot: false,
  color: false,
  option: false,
  preset: false,
  aiSuggestions: false,
  aiCatalog: false,
};

type BuilderState = {
  toggles: Record<FeatureKey, boolean>;
  params: FeatureParams;
  savedAt: string | null;
  setToggle: (k: FeatureKey, on: boolean) => void;
  setParam: <T extends keyof FeatureParams>(k: T, v: NonNullable<FeatureParams[T]>) => void;
  reset: () => void;
  loadFromBlueprint: (bp: ConfiguratorBlueprint) => void;
  setSavedAt: (iso: string | null) => void;
};

export const useBuilderStore = create<BuilderState>((set) => ({
  toggles: { ...DEFAULT_TOGGLES },
  params: { screenshot: { resolution: "1x" } },
  savedAt: null,
  setToggle: (k, on) => set((s) => ({ toggles: { ...s.toggles, [k]: on } })),
  setParam: (k, v) => set((s) => ({ params: { ...s.params, [k]: v } })),
  reset: () =>
    set({
      toggles: { ...DEFAULT_TOGGLES },
      params: { screenshot: { resolution: "1x" } },
      savedAt: null,
    }),
  loadFromBlueprint: (bp) =>
    set({
      toggles: { ...bp.featureToggles },
      params: { ...bp.featureParams },
      savedAt: bp.createdAt ?? null,
    }),
  setSavedAt: (iso) => set({ savedAt: iso }),
}));
