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

const currency = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

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
  const latencyP95 = useLatencyP95();
  const fps = useFps();

  const latencyWarning = latencyP95 > 500;
  const fpsWarning = fps < 60;

  if (!display) {
    return <div className="text-sm text-neutral-500">No estimate available yet.</div>;
  }

  return (
    <div className="space-y-3 text-sm">
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
        {status === "error" && <span className="text-red-600">Fallback to last known total ({lastError})</span>}
      </div>

      <div className="flex items-center gap-4 text-xs">
        <span className={clsx(latencyWarning ? "text-red-600" : "text-neutral-500")}>
          Latency P95: {Math.round(latencyP95)} ms
        </span>
        <span className={clsx(fpsWarning ? "text-red-600" : "text-neutral-500")}>FPS: {fps}</span>
        {latencyWarning && <span className="text-red-600">Latency exceeds 500 ms target</span>}
        {fpsWarning && <span className="text-red-600">FPS below 60 budget</span>}
      </div>

      <div>
        <button
          type="button"
          className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs font-medium hover:bg-neutral-50"
          onClick={() => setShowBreakdown((v) => !v)}
        >
          {showBreakdown ? "Hide" : "View"} breakdown
        </button>
      </div>

      {showBreakdown && (
        <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600">
          <div className="font-semibold text-neutral-700 mb-2">Feature breakdown</div>
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
    </div>
  );
}
