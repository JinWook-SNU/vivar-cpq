"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  useBuilderStore,
  type FeatureKey,
  DEFAULT_COLOR,
  DEFAULT_OPTIONS,
} from "@/lib/store/builder";
import { usePricingStore } from "@/lib/store/pricing";
import { useShallow } from "zustand/react/shallow";
import { useLatencyP95 } from "@/lib/metrics/latency";
import { useFps, ensureFpsSampler } from "@/lib/metrics/fps";
import { buildEstimateMarkdown } from "@/lib/export/markdown";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const currency = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return "—";
  return currency.format(value);
}

export default function EstimatePanel() {
  const { toggles, activePresetId, colorHex, optionMap } = useBuilderStore(
    useShallow((state) => ({
      toggles: state.toggles,
      activePresetId: state.activePresetId,
      colorHex: state.params.color?.hex ?? DEFAULT_COLOR,
      optionMap: state.params.options ?? DEFAULT_OPTIONS,
    }))
  );
  const { totals, optimistic, status, lastError, requestQuote } = usePricingStore(
    useShallow((state) => ({
      totals: state.totals,
      optimistic: state.optimistic,
      status: state.status,
      lastError: state.lastError,
      requestQuote: state.requestQuote,
    }))
  );

  const features = useMemo<FeatureKey[]>(() => {
    return Object.entries(toggles)
      .filter(([, on]) => on)
      .map(([key]) => key as FeatureKey);
  }, [toggles]);

  const colorSignature = colorHex.toLowerCase();
  const optionSignature = useMemo(() => {
    return Object.entries(optionMap)
      .map(([key, value]) => `${key}:${value ? 1 : 0}`)
      .sort()
      .join(",");
  }, [optionMap]);

  const pricingSignature = useMemo(
    () => [features.join("|"), activePresetId ?? "", colorSignature, optionSignature].join("::"),
    [features, activePresetId, colorSignature, optionSignature]
  );

  const requestRef = useRef(requestQuote);
  useEffect(() => {
    requestRef.current = requestQuote;
  }, [requestQuote]);

  useEffect(() => {
    requestRef.current(features);
  }, [pricingSignature, features]);

  useEffect(() => {
    ensureFpsSampler();
  }, []);

  const display = totals ?? optimistic;
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [toast, setToast] = useState<{ id: string; type: "latency" | "fps"; message: string } | null>(null);
  const [exportNotice, setExportNotice] = useState<{ tone: "success" | "info" | "error"; message: string } | null>(null);
  const latencyP95 = useLatencyP95();
  const fps = useFps();

  const latencyWarning = latencyP95 > 500;
  const fpsWarning = fps < 60;

  const lastLatencyWarning = useRef(false);
  const lastFpsWarning = useRef(false);

  useEffect(() => {
    if (latencyWarning && !lastLatencyWarning.current) {
      console.warn(
        "[Metrics] Pricing latency P95 exceeded 500 ms. Falling back to cached totals until the API recovers."
      );
      setToast({
        id: createId(),
        type: "latency",
        message: "Pricing latency P95 exceeded 500 ms. Showing cached totals.",
      });
    }
    lastLatencyWarning.current = latencyWarning;
  }, [latencyWarning]);

  useEffect(() => {
    if (fpsWarning && !lastFpsWarning.current) {
      console.warn(
        "[Metrics] Viewer FPS dropped below 60. Consider disabling heavy scene features for this demo."
      );
      setToast({
        id: createId(),
        type: "fps",
        message: "Viewer FPS dropped below 60 FPS. Simplify the scene to restore smoothness.",
      });
    }
    lastFpsWarning.current = fpsWarning;
  }, [fpsWarning]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const dismissToast = () => setToast(null);

  useEffect(() => {
    if (!exportNotice) return;
    const timeout = setTimeout(() => setExportNotice(null), 3000);
    return () => clearTimeout(timeout);
  }, [exportNotice]);

  const handleExport = async () => {
    if (!display) return;
    const markdown = buildEstimateMarkdown({
      estimate: display,
      features,
      presetId: activePresetId ?? null,
      colorHex,
      options: optionMap,
      latencyP95,
      fps,
    });
    const filename = `estimate-${display.traceId.slice(0, 8)}.md`;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(markdown);
        setExportNotice({
          tone: "success",
          message: "Markdown copied to clipboard.",
        });
        return;
      }
      throw new Error("Clipboard unavailable");
    } catch {
      try {
        const blob = new Blob([markdown], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setExportNotice({
          tone: "info",
          message: `Downloaded ${filename}`,
        });
      } catch (downloadError) {
        console.error(downloadError);
        setExportNotice({
          tone: "error",
          message: "Unable to export markdown in this environment.",
        });
      }
    }
  };

  if (!display) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estimate</CardTitle>
          <CardDescription>
            Review pricing and performance signals before sharing with prospects.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-neutral-500">No estimate available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estimate</CardTitle>
        <CardDescription>
          Review pricing and performance signals before sharing with prospects.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {toast && (
          <div
            role="alert"
            className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <span>{toast.message}</span>
              <button
                type="button"
                className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-200"
                onClick={dismissToast}
                aria-label="Dismiss warning"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {exportNotice && (
          <div
            role="status"
            className={clsx(
              "rounded-md border px-3 py-2 text-xs shadow-sm",
              exportNotice.tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
              exportNotice.tone === "info" && "border-blue-200 bg-blue-50 text-blue-700",
              exportNotice.tone === "error" && "border-red-200 bg-red-50 text-red-700"
            )}
          >
            {exportNotice.message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-neutral-800">
          <span className="text-neutral-500">Dev Estimate</span>
          <span>{formatCurrency(display.dev)}</span>
          <span className="text-neutral-500">Maintenance</span>
          <span>{formatCurrency(display.maint)}</span>
          <span className="text-neutral-500">Overhead</span>
          <span>{formatCurrency(display.overhead)}</span>
          <span className="text-neutral-500">Technology Fee</span>
          <span>{formatCurrency(display.technology)}</span>
          <span className="text-neutral-500">VAT</span>
          <span>{formatCurrency(display.vat)}</span>
          <span className="text-neutral-500 font-medium">Total</span>
          <span className="font-semibold">{formatCurrency(display.total)}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span>
            Source: {totals ? "Server" : "Optimistic"} · Updated {new Date(display.generatedAt).toLocaleTimeString()}
          </span>
          {status === "fetching" && <span className="text-amber-600">Recalculating…</span>}
          {status === "error" && (
            <span className="text-red-600">Fallback to last known total ({lastError})</span>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className={clsx(latencyWarning ? "text-red-600" : "text-neutral-500")}>
            Latency P95: {Math.round(latencyP95)} ms
          </span>
          {latencyWarning && (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
              Latency Warning
            </span>
          )}
          <span className={clsx(fpsWarning ? "text-red-600" : "text-neutral-500")}>FPS: {fps}</span>
          {fpsWarning && (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
              FPS Warning
            </span>
          )}
          {latencyWarning && <span className="text-red-600">Latency exceeds 500 ms target</span>}
          {fpsWarning && <span className="text-red-600">FPS below 60 budget</span>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs font-medium hover:bg-neutral-50"
            onClick={() => setShowBreakdown((v) => !v)}
          >
            {showBreakdown ? "Hide" : "View"} breakdown
          </button>
          <button
            type="button"
            className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs font-medium hover:bg-neutral-50"
            onClick={handleExport}
          >
            Export markdown
          </button>
        </div>

        {showBreakdown && (
          <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600">
            <div className="mb-2 font-semibold text-neutral-700">Feature breakdown</div>
            <ul className="space-y-1">
              {display.featureBreakdown.map((item) => (
                <li key={item.featureKey} className="flex items-center justify-between">
                  <span>{item.featureKey}</span>
                  <span>
                    {formatCurrency(item.devDelta)} / {formatCurrency(item.maintDelta)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 text-neutral-400">
              Trace: {display.traceId} · Features: {display.trace.included.join(", ")}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
