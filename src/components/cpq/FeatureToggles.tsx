"use client";
import { useMemo, useState } from "react";
import clsx from "clsx";
import {
  useBuilderStore,
  type ConfiguratorBlueprint,
  type FeatureKey,
} from "@/lib/store/builder";
import { useShallow } from "zustand/react/shallow";
import { applyRules } from "@/lib/featureRules";
import {
  loadBlueprint,
  saveBlueprint,
  toBlueprint,
} from "@/lib/persist/blueprint";

const ITEMS: { key: FeatureKey; label: string }[] = [
  { key: "dimension", label: "Dimension" },
  { key: "ar", label: "AR (placeholder)" },
  { key: "fullscreen", label: "Fullscreen" },
  { key: "screenshot", label: "Screenshot" },
  { key: "color", label: "Color" },
  { key: "option", label: "Option" },
  { key: "preset", label: "Presets" },
  { key: "aiSuggestions", label: "AI Suggestions" },
  { key: "aiCatalog", label: "AI Catalog" },
];

type StatusTone = "info" | "error" | "success";

export default function FeatureToggles() {
  const { toggles, params, savedAt, setToggle, setSavedAt, loadFromBlueprint } =
    useBuilderStore(
      useShallow((state) => ({
        toggles: state.toggles,
        params: state.params,
        savedAt: state.savedAt,
        setToggle: state.setToggle,
        setSavedAt: state.setSavedAt,
        loadFromBlueprint: state.loadFromBlueprint,
      }))
    );
  const [status, setStatus] = useState<{ tone: StatusTone; message: string } | null>(null);

  function onToggle(key: FeatureKey, on: boolean) {
    const result = applyRules(toggles, { key, on });
    (Object.entries(result.next) as [FeatureKey, boolean][]).forEach(([k, v]) => {
      if (toggles[k] !== v) {
        setToggle(k, v);
      }
    });

    if (result.message) {
      setStatus({
        tone: result.blocked.length ? "error" : "info",
        message: result.message,
      });
    } else {
      setStatus(null);
    }
  }

  function handleSave() {
    const blueprint: ConfiguratorBlueprint = toBlueprint(toggles, params);
    saveBlueprint(blueprint);
    setSavedAt(blueprint.createdAt);
    setStatus({ tone: "success", message: "Saved current configuration." });
  }

  function handleLoad() {
    const blueprint = loadBlueprint();
    if (!blueprint) {
      setStatus({ tone: "error", message: "No saved configuration found." });
      return;
    }
    loadFromBlueprint(blueprint);
    setStatus({ tone: "info", message: "Loaded the last saved configuration." });
  }

  const savedLabel = useMemo(() => {
    if (!savedAt) return "Not saved yet";
    try {
      return `Saved ${new Date(savedAt).toLocaleString()}`;
    } catch {
      return `Saved at ${savedAt}`;
    }
  }, [savedAt]);

  return (
    <div className="space-y-3">
      {status && (
        <div
          className={clsx(
            "rounded-md border px-3 py-2 text-sm",
            status.tone === "error" && "border-red-300 bg-red-50 text-red-700",
            status.tone === "info" && "border-amber-300 bg-amber-50 text-amber-700",
            status.tone === "success" && "border-emerald-300 bg-emerald-50 text-emerald-700"
          )}
        >
          {status.message}
        </div>
      )}
      <div className="space-y-2">
        {ITEMS.map((it) => (
          <label key={it.key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!toggles[it.key]}
              onChange={(e) => onToggle(it.key, e.currentTarget.checked)}
            />
            <span>{it.label}</span>
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-2 text-sm">
        <button
          type="button"
          className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs font-medium hover:bg-neutral-50"
          onClick={handleSave}
          data-testid="save-blueprint"
        >
          Save Blueprint
        </button>
        <button
          type="button"
          className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs font-medium hover:bg-neutral-50"
          onClick={handleLoad}
          data-testid="load-blueprint"
        >
          Load Blueprint
        </button>
        <span className="ml-auto text-xs text-neutral-500" data-testid="saved-at">
          {savedLabel}
        </span>
      </div>
    </div>
  );
}
