import { create } from "zustand";

export type FeatureKey =
  | "dimension" | "ar" | "fullscreen" | "screenshot"
  | "color" | "option" | "preset"
  | "aiSuggestions" | "aiCatalog";

export type ViewerOptionId = "spoiler" | "roofRack";

export const DEFAULT_COLOR = "#f5f5f5";
export const DEFAULT_BACKGROUND_COLOR = "#111827";

export const DEFAULT_OPTIONS: Record<ViewerOptionId, boolean> = {
  spoiler: false,
  roofRack: false,
};

export type FeatureParams = Partial<{
  screenshot: { resolution: "1x" | "2x" };
  ar: { assetUrl?: string };
  color: { hex: string };
  options: Record<ViewerOptionId, boolean>;
}>;

export type ConfiguratorBlueprint = {
  version: 1;
  createdAt: string;
  featureToggles: Record<FeatureKey, boolean>;
  featureParams: FeatureParams;
  presetId?: string | null;
  environment?: {
    backgroundColor: string;
  };
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

const DEFAULT_PARAMS: FeatureParams = {
  screenshot: { resolution: "1x" },
  color: { hex: DEFAULT_COLOR },
  options: { ...DEFAULT_OPTIONS },
};

export const DEFAULT_ENVIRONMENT = {
  backgroundColor: DEFAULT_BACKGROUND_COLOR,
};

export type PresetPayload = {
  id: string;
  color: string;
  options?: Partial<Record<ViewerOptionId, boolean>>;
};

type BuilderState = {
  toggles: Record<FeatureKey, boolean>;
  params: FeatureParams;
  environment: typeof DEFAULT_ENVIRONMENT;
  savedAt: string | null;
  activePresetId: string | null;
  setToggle: (k: FeatureKey, on: boolean) => void;
  setParam: <T extends keyof FeatureParams>(k: T, v: NonNullable<FeatureParams[T]>) => void;
  setColorHex: (hex: string) => void;
  setOptionValue: (id: ViewerOptionId, enabled: boolean) => void;
  setEnvironment: (partial: Partial<typeof DEFAULT_ENVIRONMENT>) => void;
  reset: () => void;
  loadFromBlueprint: (bp: ConfiguratorBlueprint) => void;
  setSavedAt: (iso: string | null) => void;
  applyPreset: (preset: PresetPayload) => void;
  resetPreset: () => void;
  getActiveFeatures: () => FeatureKey[];
};

export const useBuilderStore = create<BuilderState>((set, get) => ({
  toggles: { ...DEFAULT_TOGGLES },
  params: { ...DEFAULT_PARAMS },
  environment: { ...DEFAULT_ENVIRONMENT },
  savedAt: null,
  activePresetId: null,
  setToggle: (k, on) => set((s) => ({ toggles: { ...s.toggles, [k]: on } })),
  setParam: (k, v) => set((s) => ({ params: { ...s.params, [k]: v } })),
  setColorHex: (hex) =>
    set((state) => ({
      params: {
        ...state.params,
        color: { hex },
      },
      activePresetId: null,
    })),
  setOptionValue: (id, enabled) =>
    set((state) => ({
      params: {
        ...state.params,
        options: {
          ...(state.params.options ?? { ...DEFAULT_OPTIONS }),
          [id]: enabled,
        },
      },
      activePresetId: null,
    })),
  setEnvironment: (partial) =>
    set((state) => ({
      environment: {
        ...state.environment,
        ...partial,
      },
    })),
  reset: () =>
    set({
      toggles: { ...DEFAULT_TOGGLES },
      params: { ...DEFAULT_PARAMS },
      environment: { ...DEFAULT_ENVIRONMENT },
      savedAt: null,
      activePresetId: null,
    }),
  loadFromBlueprint: (bp) => {
    const nextParams = bp.featureParams ?? {};
    const nextEnvironment = bp.environment ?? {};
    return set({
      toggles: { ...bp.featureToggles },
      params: {
        ...DEFAULT_PARAMS,
        ...nextParams,
        color: nextParams.color ?? { hex: DEFAULT_COLOR },
        options: nextParams.options ?? { ...DEFAULT_OPTIONS },
      },
      environment: {
        ...DEFAULT_ENVIRONMENT,
        ...nextEnvironment,
      },
      savedAt: bp.createdAt ?? null,
      activePresetId: bp.presetId ?? null,
    });
  },
  setSavedAt: (iso) => set({ savedAt: iso }),
  applyPreset: (preset) =>
    set((state) => ({
      activePresetId: preset.id,
      params: {
        ...state.params,
        color: { hex: preset.color },
        options: {
          ...DEFAULT_OPTIONS,
          ...(state.params.options ?? {}),
          ...(preset.options ?? {}),
        },
      },
    })),
  resetPreset: () =>
    set((state) => ({
      activePresetId: null,
      params: {
        ...state.params,
        color: { hex: DEFAULT_COLOR },
        options: { ...DEFAULT_OPTIONS },
      },
    })),
  getActiveFeatures: () => {
    const { toggles } = get();
    return Object.entries(toggles)
      .filter(([, on]) => on)
      .map(([key]) => key as FeatureKey);
  },
}));
