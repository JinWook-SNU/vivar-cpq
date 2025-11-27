"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import FeatureToggles from "@/components/cpq/FeatureToggles";
import EstimatePanel from "@/components/cpq/EstimatePanel";
import ConfiguratorShell from "@/components/cpq/ConfiguratorShell";
import EnvironmentSettings from "@/components/cpq/EnvironmentSettings";
import ShareLink from "@/components/cpq/ShareLink";
import { useFpsStatus } from "@/lib/metrics/fps";
import { useBuilderStore } from "@/lib/store/builder";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ViewportMode = "desktop" | "mobile";

export const VIEWPORT_TRANSITION_MS = 280;

const VIEWPORTS: Record<
  ViewportMode,
  {
    label: string;
    description: string;
    frameClass: string;
  }
> = {
  desktop: {
    label: "Desktop",
    description: "1440px canvas",
    frameClass: "max-w-[1200px] min-h-[520px]",
  },
  mobile: {
    label: "Mobile",
    description: "414px viewport",
    frameClass: "max-w-[414px] min-h-[640px]",
  },
};

function DeviceSwitch({
  mode,
  onChange,
}: {
  mode: ViewportMode;
  onChange: (next: ViewportMode) => void;
}) {
  return (
    <div role="group" aria-label="Select device mode" className="inline-flex rounded-md border border-neutral-200 bg-neutral-50 shadow-sm">
      {(Object.keys(VIEWPORTS) as ViewportMode[]).map((value) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            aria-controls="device-frame"
            className={clsx(
              "px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring focus-visible:ring-neutral-400",
              active
                ? "bg-white text-neutral-900 shadow-inner"
                : "text-neutral-500 hover:text-neutral-700 hover:bg-white/60"
            )}
            onClick={() => onChange(value)}
          >
            <span className="block text-sm font-semibold">{VIEWPORTS[value].label}</span>
            <span className="block text-[11px] uppercase tracking-wide text-neutral-500">
              {VIEWPORTS[value].description}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function Page() {
  const toggles = useBuilderStore((state) => state.toggles);
  const [mode, setMode] = useState<ViewportMode>("desktop");
  const [isSwitching, setIsSwitching] = useState(false);
  const transitionHandle = useRef<number | null>(null);
  const shellFocusRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    if (typeof window.matchMedia !== "function") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const { fps, warning } = useFpsStatus();
  const showFpsBadge = warning && isSwitching;

  const frameClasses = clsx(
    "relative mx-auto overflow-hidden rounded-[28px] border border-neutral-200 bg-gradient-to-b from-neutral-50 to-white shadow transition-all ease-out w-full h-full",
    VIEWPORTS[mode].frameClass,
    isSwitching && !prefersReducedMotion ? "ring-2 ring-neutral-200" : "ring-1 ring-transparent"
  );

  const handleModeChange = useCallback(
    (next: ViewportMode) => {
      if (next === mode) return;
      setMode(next);
      if (prefersReducedMotion) {
        shellFocusRef.current?.focus({ preventScroll: true });
        return;
      }
      setIsSwitching(true);
      if (transitionHandle.current) {
        window.clearTimeout(transitionHandle.current);
      }
      transitionHandle.current = window.setTimeout(() => {
        setIsSwitching(false);
        shellFocusRef.current?.focus({ preventScroll: true });
      }, VIEWPORT_TRANSITION_MS);
    },
    [mode, prefersReducedMotion]
  );

  useEffect(() => {
    shellFocusRef.current?.focus({ preventScroll: true });
    return () => {
      if (transitionHandle.current) {
        window.clearTimeout(transitionHandle.current);
      }
    };
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-muted">
      <div className="flex h-full w-full flex-col gap-6 overflow-hidden lg:flex-row">
        {/* Left: Live Configurator */}
        <div className="flex h-full min-h-[480px] flex-1 flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-neutral-800">Live Configurator Preview</p>
              <p className="text-xs text-neutral-500">
                Switch devices to validate layout responsiveness within 300 ms.
              </p>
            </div>
            <DeviceSwitch mode={mode} onChange={handleModeChange} />
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div
              id="device-frame"
              data-testid="device-frame"
              data-mode={mode}
              data-transition-ms={VIEWPORT_TRANSITION_MS}
              className={frameClasses}
              style={{
                transitionDuration: prefersReducedMotion ? "0ms" : `${VIEWPORT_TRANSITION_MS}ms`,
              }}
            >
              {showFpsBadge && (
                <span
                  className="absolute right-4 top-4 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 shadow-sm"
                  data-testid="fps-alert"
                >
                  FPS {fps}
                </span>
              )}
              <div className={clsx("transition-opacity duration-150", isSwitching ? "opacity-0" : "opacity-100")}>
                <div
                  ref={shellFocusRef}
                  tabIndex={-1}
                  className={clsx("h-full w-full overflow-y-auto focus:outline-none", "bg-transparent")}
                  aria-label={mode === "desktop" ? "Desktop configurator preview" : "Mobile configurator preview"}
                  data-device-primary={mode}
                >
                  <ConfiguratorShell toggles={toggles} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Builder */}
        <div className="flex h-full w-full flex-col gap-6 overflow-y-auto pr-1 lg:w-[360px] lg:flex-none lg:pr-0">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted" />}>
            <FeatureToggles />
          </Suspense>
          <Card>
            <CardHeader>
              <CardTitle>Share Blueprint</CardTitle>
              <CardDescription>Create a link that opens this configuration on another device.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <ShareLink />
            </CardContent>
          </Card>
          <EnvironmentSettings />
          <EstimatePanel />
        </div>
      </div>
    </div>
  );
}
