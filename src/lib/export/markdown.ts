import type { PricingSnapshot } from "@/lib/store/pricing";
import type { FeatureKey } from "@/lib/store/builder";

type MarkdownOptions = {
  estimate: PricingSnapshot;
  features: FeatureKey[];
  presetId: string | null;
  colorHex: string;
  options: Record<string, boolean>;
  latencyP95: number;
  fps: number;
};

function formatCurrencyKRW(value: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatOptionLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .replace(/^\w/, (char) => char.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
}

function formatOptions(options: Record<string, boolean>): string {
  const entries = Object.entries(options);
  if (entries.length === 0) {
    return "- (none)";
  }

  return entries
    .map(([key, enabled]) => `- ${formatOptionLabel(key)}: ${enabled ? "Enabled" : "Disabled"}`)
    .join("\n");
}

export function buildEstimateMarkdown({
  estimate,
  features,
  presetId,
  colorHex,
  options,
  latencyP95,
  fps,
}: MarkdownOptions): string {
  const generatedAt = new Date(estimate.generatedAt).toLocaleString();
  const totalsTable = [
    ["Dev Estimate", estimate.dev],
    ["Maintenance", estimate.maint],
    ["Overhead", estimate.overhead],
    ["Technology Fee", estimate.technology],
    ["VAT", estimate.vat],
    ["Total", estimate.total],
  ];

  const featureRows =
    estimate.featureBreakdown.length > 0
      ? estimate.featureBreakdown
          .map(
            (item) =>
              `| ${item.featureKey} | ${formatCurrencyKRW(item.devDelta)} | ${formatCurrencyKRW(
                item.maintDelta
              )} |`
          )
          .join("\n")
      : "| (none) | — | — |";

  const totalsMarkdown = totalsTable
    .map(([label, value]) => `| ${label} | ${formatCurrencyKRW(value as number)} |`)
    .join("\n");

  const featureList =
    features.length > 0 ? features.map((feature) => `- ${feature}`).join("\n") : "- (none)";

  return [
    "# Configurator Estimate",
    "",
    `- Generated at: ${generatedAt}`,
    `- Source: ${estimate.source === "server" ? "Server (final)" : "Optimistic (in-progress)"}`,
    `- Active preset: ${presetId ?? "None"}`,
    `- Primary color: ${colorHex.toUpperCase()}`,
    "",
    "## Active Features",
    featureList,
    "",
    "## Selected Options",
    formatOptions(options),
    "",
    "## Totals",
    "| Item | Amount |",
    "| --- | ---: |",
    totalsMarkdown,
    "",
    "## Feature Breakdown",
    "| Feature | Dev | Maint |",
    "| --- | ---: | ---: |",
    featureRows,
    "",
    "## Performance Signals",
    `- Pricing latency P95: ${Math.round(latencyP95)} ms`,
    `- Viewer FPS: ${fps}`,
    "",
    `Trace ID: \`${estimate.traceId}\``,
    `Included features: ${estimate.trace.included.join(", ") || "none"}`,
    "",
  ].join("\n");
}
