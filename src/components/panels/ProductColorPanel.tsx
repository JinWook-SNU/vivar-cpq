"use client";

import clsx from "clsx";
import { useMemo } from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { useSceneBridge, useViewerScene } from "@/components/viewer/SceneCanvas";
import { useRuntimeStore } from "@/lib/store/runtime";
import { PRODUCT_SWATCHES } from "@/components/panels/colorPalettes";

export default function ProductColorPanel() {
  const visible = useBuilderStore((state) => state.toggles.color);
  const { setColor } = useViewerScene();
  const { setProduct } = useSceneBridge();
  const currentProduct = useRuntimeStore((state) => state.productColor);
  const swatches = useMemo(() => PRODUCT_SWATCHES, []);

  if (!visible) return null;

  return (
    <div className="flex flex-col gap-2" data-testid="panel-product-color">
      <p className="text-xs uppercase tracking-wide text-neutral-500">Product Finish</p>
      <div className="flex flex-wrap gap-2">
        {swatches.map((swatch) => {
          const active = currentProduct.toLowerCase() === swatch.value.toLowerCase();
          return (
            <button
              key={swatch.value}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setColor(swatch.value);
                setProduct(swatch.value);
              }}
              className={clsx(
                "h-8 w-8 rounded-full border-2 transition hover:scale-105",
                active ? "border-neutral-900" : "border-transparent",
                "shadow-sm"
              )}
              style={{ backgroundColor: swatch.value }}
              aria-label={`Set product color to ${swatch.label}`}
            />
          );
        })}
      </div>
    </div>
  );
}
