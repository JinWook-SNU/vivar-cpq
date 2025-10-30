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
    <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-2" data-testid="util-group">
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

export default function ConfiguratorShell({ toggles }: ConfiguratorShellProps) {
  const vm = composeVisible(toggles);
  const hasPanels = Object.values(vm.panels).some(Boolean);
  const shellLayout = clsx(
    "grid w-full gap-6",
    hasPanels
      ? "md:grid-cols-[minmax(640px,1.7fr)_minmax(320px,1fr)]"
      : "md:grid-cols-1"
  );
  const viewerContainer = clsx(
    "relative flex h-full min-h-[360px] w-full min-w-[280px] overflow-hidden rounded-2xl border border-neutral-200 bg-white",
    "md:min-h-[520px] lg:min-h-[600px]"
  );

  return (
    <ViewerSceneProvider>
      <div className={shellLayout} data-testid="config-shell">
        <div className={viewerContainer} data-testid="shell-viewer">
          <SceneCanvas data-testid="scene-canvas" utilities={vm.utilities} />
          <VisibleUtilities
            showDimension={vm.utilities.dimension}
            showFullscreen={vm.utilities.fullscreen}
            showScreenshot={vm.utilities.screenshot}
            showAR={vm.utilities.ar}
          />
        </div>

        {hasPanels ? (
          <div className="flex min-w-[280px] flex-col gap-4" data-testid="shell-panels">
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
            className="hidden md:flex md:min-w-[320px] md:flex-col md:items-center md:justify-center md:rounded-2xl md:border md:border-dashed md:border-neutral-200 md:bg-neutral-50 md:p-6"
            data-testid="shell-panels"
          >
            <p className="text-xs text-neutral-500">
              Enable builder panels to adjust colors, options, and presets.
            </p>
          </div>
        )}
      </div>
    </ViewerSceneProvider>
  );
}
