import { create } from "zustand";
import {
  useBuilderStore,
  DEFAULT_ENVIRONMENT,
  DEFAULT_OPTIONS,
  DEFAULT_COLOR,
  type ViewerOptionId,
} from "@/lib/store/builder";

export type RuntimeState = {
  backgroundColor: string;
  productColor: string;
  activeOptions: Record<ViewerOptionId, boolean>;
  setBackgroundColor: (hex: string) => void;
  setProductColor: (hex: string) => void;
  setOptions: (options: Partial<Record<ViewerOptionId, boolean>> | null | undefined) => void;
  setOptionFlag: (id: ViewerOptionId, enabled: boolean) => void;
};

const DEFAULT_BACKGROUND = DEFAULT_ENVIRONMENT.backgroundColor;

const getInitialBackground = () =>
  useBuilderStore.getState().environment.backgroundColor || DEFAULT_BACKGROUND;

const getInitialProductColor = () =>
  useBuilderStore.getState().params.color?.hex ?? DEFAULT_COLOR;

const getInitialOptions = () => ({
  ...DEFAULT_OPTIONS,
  ...(useBuilderStore.getState().params.options ?? {}),
});

export const useRuntimeStore = create<RuntimeState>((set) => ({
  backgroundColor: getInitialBackground(),
  productColor: getInitialProductColor(),
  activeOptions: getInitialOptions(),
  setBackgroundColor: (hex) =>
    set(() => ({
      backgroundColor: hex || DEFAULT_BACKGROUND,
    })),
  setProductColor: (hex) =>
    set(() => ({
      productColor: hex || DEFAULT_COLOR,
    })),
  setOptions: (options) =>
    set(() => ({
      activeOptions: {
        ...DEFAULT_OPTIONS,
        ...(options ?? {}),
      },
    })),
  setOptionFlag: (id, enabled) =>
    set((state) => ({
      activeOptions: {
        ...state.activeOptions,
        [id]: enabled,
      },
    })),
}));

let lastBackgroundColor = getInitialBackground();
let lastProductColor = getInitialProductColor();
let lastOptions = useBuilderStore.getState().params.options ?? null;

useBuilderStore.subscribe((state) => {
  const nextBackground = state.environment.backgroundColor || DEFAULT_BACKGROUND;
  if (nextBackground !== lastBackgroundColor) {
    lastBackgroundColor = nextBackground;
    useRuntimeStore.getState().setBackgroundColor(nextBackground);
  }

  const nextProductColor = state.params.color?.hex ?? DEFAULT_COLOR;
  if (nextProductColor !== lastProductColor) {
    lastProductColor = nextProductColor;
    useRuntimeStore.getState().setProductColor(nextProductColor);
  }

  const nextOptions = state.params.options ?? null;
  if (nextOptions !== lastOptions) {
    lastOptions = nextOptions;
    useRuntimeStore.getState().setOptions(nextOptions ?? undefined);
  }
});
