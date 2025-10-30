"use client";

import { useCallback, useState } from "react";
import clsx from "clsx";
import { useBuilderStore } from "@/lib/store/builder";
import { useShallow } from "zustand/react/shallow";
import { toBlueprint, encodeBlueprint } from "@/lib/persist/blueprint";

type ShareState = "idle" | "copied" | "error";

const INPUT_CLASSES =
  "w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-mono text-neutral-700 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300";

export default function ShareLink() {
  const { toggles, params, environment, activePresetId } = useBuilderStore(
    useShallow((state) => ({
      toggles: state.toggles,
      params: state.params,
      environment: state.environment,
      activePresetId: state.activePresetId,
    }))
  );
  const [shareUrl, setShareUrl] = useState<string>("");
  const [status, setStatus] = useState<ShareState>("idle");

  const buildShareUrl = useCallback(() => {
    const blueprint = toBlueprint(toggles, params, activePresetId, environment ?? undefined);
    const token = encodeBlueprint(blueprint);
    const origin =
      typeof window !== "undefined" && window.location ? window.location.origin : "";
    return `${origin}/cpq-builder?blueprint=${token}`;
  }, [toggles, params, activePresetId, environment]);

  const handleGenerate = useCallback(async () => {
    const url = buildShareUrl();
    setShareUrl(url);
    if (typeof navigator !== "undefined" && typeof navigator.clipboard !== "undefined") {
      try {
        await navigator.clipboard.writeText(url);
        setStatus("copied");
        return;
      } catch {
        setStatus("error");
        return;
      }
    }
    setStatus("error");
  }, [buildShareUrl]);

  const handleSelect = useCallback(() => {
    if (!shareUrl || typeof window === "undefined") return;
    const input = document.getElementById("share-link-input") as HTMLInputElement | null;
    if (input) {
      input.focus();
      input.select();
    }
  }, [shareUrl]);

  const actionLabel =
    status === "copied"
      ? "Link copied!"
      : status === "error"
      ? "Copy failed – select manually"
      : "Copy share link";

  return (
    <div className="space-y-3" data-testid="share-blueprint">
      <p className="text-xs text-neutral-500">
        Generate a URL that loads this configuration on another device. The link encodes the
        current toggles, colors, options, presets, and environment settings.
      </p>
      <button
        type="button"
        onClick={handleGenerate}
        className={clsx(
          "rounded-md border px-3 py-1 text-xs font-medium transition",
          status === "copied"
            ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100"
            : status === "error"
            ? "border-red-300 bg-red-50 text-red-700 hover:border-red-400 hover:bg-red-100"
            : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50"
        )}
        data-testid="copy-share-link"
      >
        {actionLabel}
      </button>
      <div>
        <label htmlFor="share-link-input" className="block text-[11px] uppercase text-neutral-500">
          Shareable URL
        </label>
        <input
          id="share-link-input"
          type="text"
          className={INPUT_CLASSES}
          value={shareUrl}
          readOnly
          onFocus={handleSelect}
          data-testid="share-link-input"
          placeholder="Click “Copy share link” to generate"
        />
      </div>
    </div>
  );
}
