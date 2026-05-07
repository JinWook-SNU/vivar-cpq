import * as React from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import { composeVisible } from "@/lib/runtime/composer";
import { ViewerSceneProvider } from "@/components/viewer/SceneCanvas";
import DimensionHUD from "@/components/viewer/DimensionHUD";
import FullscreenButton from "@/components/viewer/FullscreenButton";
import ScreenshotButton from "@/components/viewer/ScreenshotButton";
import ARButton from "@/components/viewer/ARButton";
import ProductColorPanel from "@/components/panels/ProductColorPanel";
import OptionPanel from "@/components/panels/OptionPanel";
import PresetBar from "@/components/cpq/PresetBar";
import AIStubs from "@/components/cpq/AIStubs";
import { Badge } from "@/components/ui/badge";

function VisibleUtilities({
  showDimension,
  showFullscreen,
  showScreenshot,
  showAR,
}: {
  showDimension: boolean;
  showFullscreen: boolean;
  showScreenshot: boolean;
  showAR: boolean;
}) {
  if (!showDimension && !showFullscreen && !showScreenshot && !showAR) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute left-0 top-0 flex flex-col gap-2 p-4" data-testid="util-group">
      {showDimension && (
        <div className="pointer-events-auto" data-testid="util-dimension">
          <DimensionHUD />
        </div>
      )}
      <div className="pointer-events-auto flex flex-col gap-2">
        {showFullscreen && (
          <span data-testid="util-fullscreen">
            <FullscreenButton />
          </span>
        )}
        {showScreenshot && (
          <span data-testid="util-screenshot">
            <ScreenshotButton />
          </span>
        )}
        {showAR && (
          <span data-testid="util-ar">
            <ARButton />
          </span>
        )}
      </div>
    </div>
  );
}

type ConfiguratorShellProps = {
  toggles: Record<string, boolean>;
};

const SceneCanvas = dynamic(() => import("@/components/viewer/SceneCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-neutral-400">
      Loading viewer…
    </div>
  ),
});

function BrowserChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-card shadow-lg">
      <div className="flex items-center gap-4 border-b border-neutral-200 bg-neutral-50 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-400" aria-hidden="true" />
          <span className="h-3 w-3 rounded-full bg-amber-400" aria-hidden="true" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" aria-hidden="true" />
        </div>
        <div className="flex-1 rounded-md bg-white px-4 py-1 text-xs text-neutral-500 shadow-inner">
          https://demo.vivar-cpq.app/configurator
        </div>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

export default function ConfiguratorShell({ toggles }: ConfiguratorShellProps) {
  const vm = composeVisible(toggles);
  const hasPanels = Object.values(vm.panels).some(Boolean);

  return (
    <ViewerSceneProvider>
      <BrowserChrome>
        <div
          className={clsx(
            "flex h-full min-h-0 w-full flex-col",
            hasPanels ? "md:grid md:grid-cols-[minmax(0,1fr)_320px]" : "md:flex"
          )}
          data-testid="config-shell"
        >
          <div className="relative flex h-full min-h-0 flex-1 flex-col" data-testid="shell-viewer">
            <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-200">
              <div>
                <h2 className="text-sm font-semibold text-neutral-800">Demo Configurator</h2>
                <p className="text-xs text-neutral-500">Live preview powered by current feature toggles.</p>
              </div>
              <Badge variant="success">Live</Badge>
            </div>
            <div className="relative flex-1 min-h-[480px] overflow-hidden rounded-none bg-neutral-900/90">
              <SceneCanvas data-testid="scene-canvas" utilities={vm.utilities} />
              <VisibleUtilities
                showDimension={vm.utilities.dimension}
                showFullscreen={vm.utilities.fullscreen}
                showScreenshot={vm.utilities.screenshot}
                showAR={vm.utilities.ar}
              />
            </div>
          </div>

          {hasPanels ? (
            <div
              className="hidden h-full min-h-0 flex-col gap-4 overflow-y-auto border-l border-neutral-200 bg-neutral-50 p-4 md:flex"
              data-testid="shell-panels"
            >
              {vm.panels.color && <ProductColorPanel />}
              {vm.panels.options && (
                <div data-testid="panel-options">
                  <OptionPanel />
                </div>
              )}
              {vm.panels.presets && (
                <div data-testid="panel-presets">
                  <PresetBar />
                </div>
              )}
              {vm.panels.aiSuggestions && (
                <div data-testid="panel-ai-suggestions">
                  <AIStubs.Suggestions />
                </div>
              )}
              {vm.panels.aiCatalog && (
                <div data-testid="panel-ai-catalog">
                  <AIStubs.Catalog />
                </div>
              )}
            </div>
          ) : (
            <div
              aria-hidden="true"
              data-testid="shell-panels"
              className="hidden md:flex md:min-h-0 md:flex-col md:items-center md:justify-center md:border-l md:border-dashed md:border-neutral-200 md:bg-neutral-50 md:px-8"
            >
              <p className="text-xs text-neutral-500 text-center leading-relaxed">
                Enable adjustment tabs to preview color, options, or AI suggestions alongside the demo.
              </p>
            </div>
          )}
        </div>
      </BrowserChrome>
    </ViewerSceneProvider>
  );
}
