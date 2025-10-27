"use client";
import { useBuilderStore, type FeatureKey } from "@/lib/store/builder";
import { applyRules } from "@/lib/featureRules";

const ITEMS: { key: FeatureKey; label: string }[] = [
  { key: "dimension", label: "Dimension" },
  { key: "ar", label: "AR (placeholder)" },
  { key: "fullscreen", label: "Fullscreen" },
  { key: "screenshot", label: "Screenshot" },
  { key: "color", label: "Color" },
  { key: "option", label: "Option" },
  { key: "preset", label: "Presets" },
  { key: "aiSuggestions", label: "AI Suggestions" },
  { key: "aiCatalog", label: "AI Catalog" },
];

export default function FeatureToggles() {
  const { toggles, setToggle } = useBuilderStore();

  function onToggle(key: FeatureKey, on: boolean) {
    const { next } = applyRules(toggles, { key, on });
    (Object.entries(next) as [FeatureKey, boolean][]).forEach(([k, v]) => setToggle(k, v));
  }

  return (
    <div className="space-y-2">
      {ITEMS.map((it) => (
        <label key={it.key} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!toggles[it.key]}
            onChange={(e) => onToggle(it.key, e.currentTarget.checked)}
          />
          <span>{it.label}</span>
        </label>
      ))}
    </div>
  );
}
