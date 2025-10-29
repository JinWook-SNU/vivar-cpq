"use client";

import clsx from "clsx";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useBuilderStore, type PresetPayload } from "@/lib/store/builder";
import { PRODUCT_SWATCHES } from "@/components/panels/colorPalettes";

type Preset = PresetPayload & { label: string };

const PRESETS: Preset[] = [
  {
    id: "minimal",
    label: "Minimal",
    color: PRODUCT_SWATCHES[0]?.value ?? "#f5f5f5",
    options: { spoiler: false, roofRack: false },
  },
  {
    id: "sport",
    label: "Sport",
    color: PRODUCT_SWATCHES[1]?.value ?? "#ff6b6b",
    options: { spoiler: true, roofRack: false },
  },
  {
    id: "adventure",
    label: "Adventure",
    color: PRODUCT_SWATCHES[2]?.value ?? "#1e90ff",
    options: { spoiler: false, roofRack: true },
  },
];

export default function PresetBar() {
  const { toggles, activePresetId, applyPreset, resetPreset } = useBuilderStore(
    useShallow((state) => ({
      toggles: state.toggles,
      activePresetId: state.activePresetId,
      applyPreset: state.applyPreset,
      resetPreset: state.resetPreset,
    }))
  );

  const presets = useMemo(() => PRESETS, []);

  if (!toggles.preset) return null;

  function handleApply(preset: Preset) {
    applyPreset(preset);
  }

  function handleReset() {
    resetPreset();
  }

  return (
    <div className="flex flex-col gap-2" data-testid="preset-bar">
      <p className="text-xs uppercase tracking-wide text-neutral-500">Presets</p>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const isActive = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApply(preset)}
              className={clsx(
                "rounded-md border px-3 py-1 text-xs font-medium transition hover:bg-neutral-50",
                isActive ? "border-neutral-900 bg-neutral-100" : "border-neutral-300 bg-white"
              )}
              aria-pressed={isActive}
            >
              {preset.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs font-medium transition hover:bg-neutral-50"
        >
          Reset
        </button>
      </div>
      {!toggles.option && (
        <p className="text-xs text-amber-600">
          Options toggle must be enabled to apply presets fully.
        </p>
      )}
      {activePresetId && (
        <p className="text-xs text-neutral-500">Active preset: {activePresetId}</p>
      )}
    </div>
  );
}
