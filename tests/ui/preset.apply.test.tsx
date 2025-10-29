import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import PresetBar from "@/components/cpq/PresetBar";
import EstimatePanel from "@/components/cpq/EstimatePanel";
import { ViewerSceneProvider } from "@/components/viewer/SceneCanvas";
import { PRODUCT_SWATCHES } from "@/components/panels/colorPalettes";
import { DEFAULT_COLOR, useBuilderStore } from "@/lib/store/builder";
import { usePricingStore } from "@/lib/store/pricing";

type RequestQuote = ReturnType<typeof usePricingStore.getState>["requestQuote"];

describe("Preset interactions", () => {
  let requestSpy: ReturnType<typeof vi.fn>;
  let originalRequestQuote: RequestQuote;

  beforeEach(() => {
    requestSpy = vi.fn().mockResolvedValue(undefined);
    originalRequestQuote = usePricingStore.getState().requestQuote;

    act(() => {
      useBuilderStore.getState().reset();
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
        requestQuote: requestSpy,
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
        requestQuote: originalRequestQuote,
      });
    });
    requestSpy.mockReset();
    document.body.innerHTML = "";
  });

  it("applies and resets presets while syncing pricing", async () => {
    render(
      <ViewerSceneProvider>
        <PresetBar />
        <EstimatePanel />
      </ViewerSceneProvider>
    );

    await waitFor(() => expect(requestSpy).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: /sport/i }));
    await waitFor(() => expect(requestSpy).toHaveBeenCalledTimes(2));

    const appliedState = useBuilderStore.getState();
    expect(appliedState.activePresetId).toBe("sport");
    expect(appliedState.params.color?.hex).toBe(PRODUCT_SWATCHES[1].value);
    expect(appliedState.params.options?.spoiler).toBe(true);
    expect(screen.getByRole("button", { name: /sport/i })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    await waitFor(() => expect(requestSpy).toHaveBeenCalledTimes(3));

    const resetState = useBuilderStore.getState();
    expect(resetState.activePresetId).toBeNull();
    expect(resetState.params.color?.hex).toBe(DEFAULT_COLOR);
    expect(resetState.params.options?.spoiler).toBe(false);
  });
});
