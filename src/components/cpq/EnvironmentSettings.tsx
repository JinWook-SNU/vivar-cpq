"use client";

import clsx from "clsx";
import { useEffect, useMemo } from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { useRuntimeStore } from "@/lib/store/runtime";

const BACKGROUND_SWATCHES = ["#0b1020", "#111827", "#1f2937", "#ffffff", "#f8fafc"] as const;

export default function EnvironmentSettings() {
  const backgroundColor = useBuilderStore((state) => state.environment.backgroundColor);
  const setEnvironment = useBuilderStore((state) => state.setEnvironment);
  const setRuntimeBackground = useRuntimeStore((state) => state.setBackgroundColor);

  useEffect(() => {
    setRuntimeBackground(backgroundColor);
  }, [backgroundColor, setRuntimeBackground]);

  const swatches = useMemo(() => BACKGROUND_SWATCHES, []);

  return (
    <div className="space-y-3" data-testid="builder-env-bg">
      <div>
        <h3 className="text-sm font-semibold text-neutral-800">Environment</h3>
        <p className="text-xs text-neutral-500">Tweak viewer background to match prospect brand.</p>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Background Color</p>
        <div className="flex flex-wrap gap-2">
          {swatches.map((swatch) => {
            const active = backgroundColor.toLowerCase() === swatch.toLowerCase();
            return (
              <button
                key={swatch}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setEnvironment({ backgroundColor: swatch });
                  setRuntimeBackground(swatch);
                }}
                className={clsx(
                  "h-8 w-8 rounded-full border-2 transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400",
                  active ? "border-neutral-900" : "border-transparent",
                  "shadow-sm"
                )}
                style={{ backgroundColor: swatch }}
                aria-label={`Set environment background to ${swatch}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
