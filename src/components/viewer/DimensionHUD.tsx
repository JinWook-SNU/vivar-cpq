"use client";

import clsx from "clsx";
import { useMemo } from "react";
import { useBuilderStore } from "@/lib/store/builder";

export default function DimensionHUD() {
  const visible = useBuilderStore((state) => state.toggles.dimension);

  const overlay = useMemo(
    () => (
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs uppercase tracking-wide text-neutral-500">Width</span>
        <span className="text-sm font-semibold">2.45 m</span>
        <span className="text-xs uppercase tracking-wide text-neutral-500">Depth</span>
        <span className="text-sm font-semibold">1.10 m</span>
      </div>
    ),
    []
  );

  if (!visible) return null;

  return (
    <div
      data-testid="dimension-hud"
      className={clsx(
        "pointer-events-none absolute inset-0 flex items-center justify-center",
        "bg-gradient-to-b from-white/40 via-white/10 to-white/40"
      )}
    >
      <div className="rounded-xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm">
        {overlay}
      </div>
    </div>
  );
}
