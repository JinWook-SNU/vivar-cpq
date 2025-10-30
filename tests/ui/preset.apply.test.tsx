import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import PresetBar from "@/components/cpq/PresetBar";
import EstimatePanel from "@/components/cpq/EstimatePanel";
import { ViewerSceneProvider } from "@/components/viewer/SceneCanvas";
import { PRODUCT_SWATCHES } from "@/components/panels/colorPalettes";
import { DEFAULT_COLOR, DEFAULT_OPTIONS, useBuilderStore } from "@/lib/store/builder";
import { calculatePricing } from "@/lib/pricing/engine";
import { resetPricingSignature, usePricingStore } from "@/lib/store/pricing";
import { useRuntimeStore } from "@/lib/store/runtime";

describe("Preset interactions", () => {
  let originalFetch: typeof fetch;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const pricingResponse = calculatePricing({ features: [] });
    originalFetch = global.fetch;
    fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify(pricingResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    act(() => {
      useBuilderStore.getState().reset();
      resetPricingSignature();
      useBuilderStore.setState((state) => ({
        toggles: {
          ...state.toggles,
          preset: true,
          option: true,
          color: true,
        },
      }));
      usePricingStore.setState({
        totals: null,
        optimistic: null,
        lastKnown: null,
        status: "idle",
        lastError: undefined,
      });
      useRuntimeStore.setState({
        productColor: DEFAULT_COLOR,
        activeOptions: { ...DEFAULT_OPTIONS },
      });
    });
  });

  afterEach(() => {
    act(() => {
      useBuilderStore.getState().reset();
      usePricingStore.setState({
        totals: null,
        optimistic: null,
        lastKnown: null,
        status: "idle",
        lastError: undefined,
      });
      useRuntimeStore.setState({
        productColor: DEFAULT_COLOR,
        activeOptions: { ...DEFAULT_OPTIONS },
      });
      resetPricingSignature();
    });
    if (originalFetch) {
      global.fetch = originalFetch;
    }
    document.body.innerHTML = "";
  });

  it("applies and resets presets while syncing pricing", async () => {
    render(
      <ViewerSceneProvider>
        <PresetBar />
        <EstimatePanel />
      </ViewerSceneProvider>
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: /sport/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const appliedState = useBuilderStore.getState();
    expect(appliedState.activePresetId).toBe("sport");
    expect(appliedState.params.color?.hex).toBe(PRODUCT_SWATCHES[1].value);
    expect(appliedState.params.options?.spoiler).toBe(true);
    expect(screen.getByRole("button", { name: /sport/i })).toHaveAttribute("aria-pressed", "true");
    await waitFor(() =>
      expect(useRuntimeStore.getState().productColor).toBe(PRODUCT_SWATCHES[1].value)
    );
    await waitFor(() =>
      expect(useRuntimeStore.getState().activeOptions.spoiler).toBe(true)
    );

    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));

    const resetState = useBuilderStore.getState();
    expect(resetState.activePresetId).toBeNull();
    expect(resetState.params.color?.hex).toBe(DEFAULT_COLOR);
    expect(resetState.params.options?.spoiler).toBe(false);
    await waitFor(() =>
      expect(useRuntimeStore.getState().productColor).toBe(DEFAULT_COLOR)
    );
    await waitFor(() =>
      expect(useRuntimeStore.getState().activeOptions.spoiler).toBe(false)
    );
  });
});
