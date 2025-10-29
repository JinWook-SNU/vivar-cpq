import { create } from "zustand";
import { useBuilderStore, DEFAULT_ENVIRONMENT } from "@/lib/store/builder";

export type RuntimeState = {
  backgroundColor: string;
  productColor: string;
  setBackgroundColor: (hex: string) => void;
  setProductColor: (hex: string) => void;
};

const DEFAULT_BACKGROUND = DEFAULT_ENVIRONMENT.backgroundColor;
const DEFAULT_PRODUCT = "#51cf66";

const getInitialBackground = () =>
  useBuilderStore.getState().environment.backgroundColor || DEFAULT_BACKGROUND;

export const useRuntimeStore = create<RuntimeState>((set) => ({
  backgroundColor: getInitialBackground(),
  productColor: DEFAULT_PRODUCT,
  setBackgroundColor: (hex) =>
    set(() => ({
      backgroundColor: hex || DEFAULT_BACKGROUND,
    })),
  setProductColor: (hex) =>
    set(() => ({
      productColor: hex || DEFAULT_PRODUCT,
    })),
}));

if (typeof window !== "undefined") {
  useBuilderStore.subscribe(
    (state) => state.environment.backgroundColor,
    (backgroundColor) => {
      useRuntimeStore.getState().setBackgroundColor(backgroundColor);
    }
  );
}
