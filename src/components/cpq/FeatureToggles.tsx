"use client";
import { useEffect, useMemo, useRef, useState } from "react";
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
  decodeBlueprint,
} from "@/lib/persist/blueprint";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
  const {
    toggles,
    params,
    environment,
    savedAt,
    activePresetId,
    setToggle,
    setSavedAt,
    loadFromBlueprint,
  } =
    useBuilderStore(
      useShallow((state) => ({
        toggles: state.toggles,
        params: state.params,
        environment: state.environment,
        savedAt: state.savedAt,
        activePresetId: state.activePresetId,
        setToggle: state.setToggle,
        setSavedAt: state.setSavedAt,
        loadFromBlueprint: state.loadFromBlueprint,
      }))
    );
  const [status, setStatus] = useState<{ tone: StatusTone; message: string } | null>(null);
  const searchParams = useSearchParams();
  const sharedToken = searchParams.get("blueprint");
  const hasProcessedShare = useRef(false);

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
    const blueprint: ConfiguratorBlueprint = toBlueprint(
      toggles,
      params,
      activePresetId,
      environment
    );
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

  const aiEntrypoints = useMemo(() => {
    const entries: { id: string; label: string }[] = [];
    if (toggles.aiSuggestions) {
      entries.push({ id: "ai-suggestions", label: "View AI Suggestions stub" });
    }
    if (toggles.aiCatalog) {
      entries.push({ id: "ai-catalog", label: "View AI Catalog stub" });
    }
    return entries;
  }, [toggles.aiSuggestions, toggles.aiCatalog]);

  function scrollToStub(targetId: string) {
    if (typeof window === "undefined") return;
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      if (typeof element.focus === "function") {
        element.focus();
      }
    }
  }

  useEffect(() => {
    if (hasProcessedShare.current) return;
    if (!sharedToken) return;
    hasProcessedShare.current = true;
    const sharedBlueprint = decodeBlueprint(sharedToken);
    if (!sharedBlueprint) {
      queueMicrotask(() =>
        setStatus({
          tone: "error",
          message: "Unable to load the shared configuration link.",
        })
      );
      return;
    }
    loadFromBlueprint(sharedBlueprint);
    queueMicrotask(() =>
      setStatus({
        tone: "info",
        message: "Loaded shared configuration from link.",
      })
    );
  }, [sharedToken, loadFromBlueprint]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Toggles</CardTitle>
        <CardDescription>
          Enable or disable interactive modules to tailor the demo experience for this prospect.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
        <div className="space-y-4">
          {ITEMS.map((it) => (
            <div key={it.key} className="flex items-center justify-between gap-4">
              <span className="text-sm text-neutral-700">{it.label}</span>
              <Switch
                checked={!!toggles[it.key]}
                onCheckedChange={(next) => onToggle(it.key, next)}
                aria-label={it.label}
              />
            </div>
          ))}
        </div>
        <Separator />
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Button
            type="button"
            onClick={handleSave}
            variant="outline"
            data-testid="save-blueprint"
          >
            Save Blueprint
          </Button>
          <Button
            type="button"
            onClick={handleLoad}
            variant="outline"
            data-testid="load-blueprint"
          >
            Load Blueprint
          </Button>
          <span className="ml-auto text-xs text-neutral-500" data-testid="saved-at">
            {savedLabel}
          </span>
        </div>
        <Separator />
        {aiEntrypoints.length > 0 && (
          <div
            className="rounded-md border border-neutral-200 bg-neutral-50 p-3"
            data-testid="ai-entrypoints"
          >
            <p className="mb-2 text-xs font-medium text-neutral-600">
              Preview AI UI stubs in the live pane
            </p>
            <div className="flex flex-wrap gap-2">
              {aiEntrypoints.map((entry) => (
                <Button
                  key={entry.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToStub(entry.id)}
                >
                  {entry.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
