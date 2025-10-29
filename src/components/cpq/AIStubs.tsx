"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { useBuilderStore } from "@/lib/store/builder";
import { useShallow } from "zustand/react/shallow";

type StubStatus = "idle" | "loading" | "ready";

function useStubStatus(enabled: boolean): StubStatus {
  const [status, setStatus] = useState<StubStatus>("idle");

  useEffect(() => {
    if (!enabled) {
      const idleTimer = window.setTimeout(() => setStatus("idle"), 0);
      return () => {
        window.clearTimeout(idleTimer);
      };
    }

    const loadingTimer = window.setTimeout(() => setStatus("loading"), 0);
    const readyTimer = window.setTimeout(() => setStatus("ready"), 120);
    return () => {
      window.clearTimeout(loadingTimer);
      window.clearTimeout(readyTimer);
    };
  }, [enabled]);

  return status;
}

function SkeletonRow({ className, "data-testid": dataTestId }: { className?: string; "data-testid"?: string }) {
  return (
    <div
      data-testid={dataTestId}
      className={clsx("h-3 rounded bg-neutral-200 animate-pulse", className)}
    />
  );
}

type StubSectionProps = {
  enabled?: boolean;
  status?: StubStatus;
  "data-testid"?: string;
};

function SuggestionsSection({
  enabled = true,
  status = "ready",
  "data-testid": dataTestId,
}: StubSectionProps) {
  return (
    <section
      aria-labelledby="ai-suggestions-heading"
      className="rounded-lg border border-dashed border-neutral-200 bg-white p-4 shadow-sm"
      id="ai-suggestions"
      tabIndex={-1}
      data-testid={dataTestId}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 id="ai-suggestions-heading" className="text-sm font-semibold text-neutral-800">
            AI Suggestions
          </h3>
          <p className="text-xs text-neutral-500">
            Placeholder chips recommend quick demo setups. No live AI calls yet.
          </p>
        </div>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
          UI Stub
        </span>
      </div>

      {!enabled && (
        <p className="mt-4 text-sm text-neutral-500" data-testid="ai-suggestions-disabled">
          AI Suggestions are disabled. Toggle them on to preview guided recommendations in the live demo.
        </p>
      )}

      {enabled && (
        <div className="mt-4 space-y-3">
          {status !== "ready" && (
            <div className="space-y-2" data-testid="ai-suggestions-loading">
              <SkeletonRow className="w-1/3" />
              <SkeletonRow className="w-2/3" />
            </div>
          )}

          {status === "ready" && (
            <div className="flex flex-wrap gap-2" data-testid="ai-suggestions-chips">
              {["Interactive Onboarding", "Executive Pitch", "Launch Prep"].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50"
                  onClick={() => {
                    console.info(`[AI Stub] Suggestion selected: ${label}`);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function CatalogSection({
  enabled = true,
  status = "ready",
  "data-testid": dataTestId,
}: StubSectionProps) {
  return (
    <section
      aria-labelledby="ai-catalog-heading"
      className="rounded-lg border border-dashed border-neutral-200 bg-white p-4 shadow-sm"
      id="ai-catalog"
      tabIndex={-1}
      data-testid={dataTestId}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 id="ai-catalog-heading" className="text-sm font-semibold text-neutral-800">
            AI Catalog
          </h3>
          <p className="text-xs text-neutral-500">
            Gallery placeholder highlights AI-curated modules with contextual copy.
          </p>
        </div>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
          UI Stub
        </span>
      </div>

      {!enabled && (
        <p className="mt-4 text-sm text-neutral-500" data-testid="ai-catalog-disabled">
          AI Catalog is hidden. Enable it from the builder to show sample AI-powered modules.
        </p>
      )}

      {enabled && (
        <div className="mt-4 space-y-3">
          {status !== "ready" && (
            <div className="space-y-2" data-testid="ai-catalog-loading">
              <SkeletonRow className="h-32 w-full" />
            </div>
          )}

          {status === "ready" && (
            <article
              className="rounded-xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-4 shadow-sm"
              data-testid="ai-catalog-card"
            >
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-neutral-800">Smart Demo Modules</h4>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  Powered by AI
                </span>
              </div>
              <p className="text-xs text-neutral-600">
                Present the best configuration bundles generated from recent win data. Update this copy once the AI API is wired.
              </p>
              <button
                type="button"
                className="mt-4 inline-flex items-center justify-center rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50"
                onClick={() => {
                  console.info("[AI Stub] Catalog preview requested");
                }}
              >
                Preview catalog entry
              </button>
            </article>
          )}
        </div>
      )}
    </section>
  );
}

function AIStubsComponent() {
  const { aiSuggestionsEnabled, aiCatalogEnabled } = useBuilderStore(
    useShallow((state) => ({
      aiSuggestionsEnabled: state.toggles.aiSuggestions,
      aiCatalogEnabled: state.toggles.aiCatalog,
    }))
  );

  const suggestionsStatus = useStubStatus(aiSuggestionsEnabled);
  const catalogStatus = useStubStatus(aiCatalogEnabled);

  const activeSections = useMemo(
    () => ({
      suggestions: aiSuggestionsEnabled,
      catalog: aiCatalogEnabled,
    }),
    [aiSuggestionsEnabled, aiCatalogEnabled]
  );

  return (
    <div className="space-y-4" data-testid="ai-stubs" id="ai-stubs">
      <SuggestionsSection enabled={activeSections.suggestions} status={suggestionsStatus} />
      <CatalogSection enabled={activeSections.catalog} status={catalogStatus} />
    </div>
  );
}

const AIStubs = Object.assign(AIStubsComponent, {
  Suggestions: SuggestionsSection,
  Catalog: CatalogSection,
});

export default AIStubs;
