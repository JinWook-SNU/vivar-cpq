"use client";

import clsx from "clsx";
import { useMemo } from "react";
import { useRuntimeStore } from "@/lib/store/runtime";
import { useSceneBridge } from "@/components/viewer/SceneCanvas";
import { BACKGROUND_SWATCHES } from "@/components/panels/colorPalettes";
import { useBuilderStore } from "@/lib/store/builder";

export default function BackgroundColorPanel() {
  const { setBackground } = useSceneBridge();
  const selected = useRuntimeStore((state) => state.backgroundColor);
  const setEnvironment = useBuilderStore((state) => state.setEnvironment);
  const swatches = useMemo(() => BACKGROUND_SWATCHES, []);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs uppercase tracking-wide text-neutral-500">Viewer Background</p>
      <div className="flex flex-wrap gap-2">
        {swatches.map((swatch) => {
          const active = selected.toLowerCase() === swatch.value.toLowerCase();
          return (
            <button
              key={swatch.value}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setBackground(swatch.value);
                setEnvironment({ backgroundColor: swatch.value });
              }}
              className={clsx(
                "h-8 w-8 rounded-full border-2 transition hover:scale-105",
                active ? "border-neutral-900" : "border-transparent",
                "shadow-sm"
              )}
              style={{ backgroundColor: swatch.value }}
              aria-label={`Set background to ${swatch.label}`}
            />
          );
        })}
      </div>
    </div>
  );
}
