"use client";

import clsx from "clsx";
import { useEffect, useMemo } from "react";
import { useBuilderStore, DEFAULT_ENVIRONMENT } from "@/lib/store/builder";
import { useRuntimeStore } from "@/lib/store/runtime";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const ACCENT_SWATCHES = [
  "#0b1020", // midnight navy
  "#1c1b7a", // indigo flare
  "#5b21b6", // royal violet
  "#0ea5e9", // neon cyan
  "#0f766e", // teal glow
  "#22c55e", // aurora green
  "#f97316", // sunset orange
  "#facc15", // golden hour
  "#ffffff", // pure white
  "#f5e6ff", // lavender haze
] as const;

export default function EnvironmentSettings() {
  const backgroundColor = useBuilderStore((state) => state.environment.backgroundColor);
  const setEnvironment = useBuilderStore((state) => state.setEnvironment);
  const setRuntimeBackground = useRuntimeStore((state) => state.setBackgroundColor);

  useEffect(() => {
    setRuntimeBackground(backgroundColor);
  }, [backgroundColor, setRuntimeBackground]);

  const swatches = useMemo(() => {
    const unique = new Map<string, string>();
    unique.set(DEFAULT_ENVIRONMENT.backgroundColor, DEFAULT_ENVIRONMENT.backgroundColor);
    ACCENT_SWATCHES.forEach((hex) => {
      unique.set(hex, hex);
    });
    return Array.from(unique.values());
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Environment</CardTitle>
        <CardDescription>Tweak the viewer background to match the prospect’s brand palette.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6" data-testid="builder-env-bg">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Background Color</p>
          <div className="flex flex-wrap gap-3">
            {swatches.map((swatch) => {
              const active = backgroundColor.toLowerCase() === swatch.toLowerCase();
              return (
                <Button
                  key={swatch}
                  type="button"
                  variant="ghost"
                  className={clsx(
                    "h-8 w-8 rounded-full border-2 p-0 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2",
                    active ? "border-neutral-900" : "border-transparent"
                  )}
                  style={{ backgroundColor: swatch }}
                  aria-pressed={active}
                  aria-label={`Set environment background to ${swatch}`}
                  onClick={() => {
                    setEnvironment({ backgroundColor: swatch });
                    setRuntimeBackground(swatch);
                  }}
                />
              );
            })}
          </div>
        </div>
        <Separator decorative />
        <p className="text-xs text-neutral-500">
          Changes apply instantly to the viewer shell so you can confirm screenshot readiness without leaving the page.
        </p>
      </CardContent>
    </Card>
  );
}
