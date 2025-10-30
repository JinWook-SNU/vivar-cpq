export type ColorSwatch = {
  label: string;
  value: string;
};

export const BACKGROUND_SWATCHES: readonly ColorSwatch[] = [
  { label: "Nightfall", value: "#111827" },
  { label: "Midnight", value: "#0f172a" },
  { label: "Slate", value: "#1f2937" },
  { label: "Fog", value: "#475569" },
  { label: "Dawn", value: "#f1f5f9" },
  { label: "Sunrise", value: "#fde68a" },
] as const;

export const PRODUCT_SWATCHES: readonly ColorSwatch[] = [
  { label: "Cloud", value: "#f5f5f5" },
  { label: "Sunset", value: "#ff6b6b" },
  { label: "Ocean", value: "#1e90ff" },
  { label: "Forest", value: "#2ecc71" },
  { label: "Charcoal", value: "#0f172a" },
  { label: "Citrine", value: "#facc15" },
] as const;
