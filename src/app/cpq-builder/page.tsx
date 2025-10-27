import FeatureToggles from "@/components/cpq/FeatureToggles";
import EstimatePanel from "@/components/cpq/EstimatePanel";

export default function Page() {
  return (
    <div className="grid grid-cols-12 gap-4 p-4">
      {/* Left: Live Configurator placeholder */}
      <div className="col-span-8 rounded-2xl border p-4 min-h-[70vh]">
        <div className="text-sm text-neutral-500 mb-2">Live Configurator (placeholder)</div>
        <div className="h-[60vh] bg-neutral-100 rounded-xl grid place-items-center">
          <div>3D Canvas Placeholder</div>
        </div>
      </div>

      {/* Right: Builder */}
      <div className="col-span-4 flex flex-col gap-4">
        <div className="rounded-2xl border p-4">
          <h2 className="font-semibold mb-3">Feature Toggles</h2>
          <FeatureToggles />
        </div>
        <div className="rounded-2xl border p-4">
          <h2 className="font-semibold mb-3">Estimate</h2>
          <EstimatePanel />
        </div>
      </div>
    </div>
  );
}
