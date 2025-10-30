import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import FeatureToggles from "@/components/cpq/FeatureToggles";
import ShareLink from "@/components/cpq/ShareLink";
import ProductColorPanel from "@/components/panels/ProductColorPanel";
import OptionPanel from "@/components/panels/OptionPanel";
import PresetBar from "@/components/cpq/PresetBar";
import SceneCanvas, { ViewerSceneProvider } from "@/components/viewer/SceneCanvas";
import EstimatePanel from "@/components/cpq/EstimatePanel";
import { useBuilderStore, DEFAULT_OPTIONS, DEFAULT_COLOR } from "@/lib/store/builder";
import { useRuntimeStore } from "@/lib/store/runtime";
import { calculatePricing } from "@/lib/pricing/engine";
import { resetPricingSignature, usePricingStore } from "@/lib/store/pricing";

const renderBuilder = () =>
  render(
    <ViewerSceneProvider>
      <div className="space-y-4">
        <FeatureToggles />
        <ShareLink />
        <ProductColorPanel />
        <OptionPanel />
        <PresetBar />
        <SceneCanvas data-testid="smoke-scene" />
        <EstimatePanel />
      </div>
    </ViewerSceneProvider>
  );

describe("Builder smoke flow", () => {
  const originalFetch = global.fetch;
  const clipboardMock = vi.fn();
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn(async (_input: RequestInfo, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(init.body as string) : { features: [] };
      const pricing = calculatePricing({ features: body.features ?? [] });
      return {
        ok: true,
        json: () => Promise.resolve(pricing),
      } as Response;
    });
    global.fetch = fetchSpy as unknown as typeof fetch;

    clipboardMock.mockReset();
    clipboardMock.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: clipboardMock,
      },
      configurable: true,
    });

    localStorage.clear();
    act(() => {
      useBuilderStore.getState().reset();
      useRuntimeStore.setState({
        productColor: DEFAULT_COLOR,
        activeOptions: { ...DEFAULT_OPTIONS },
      });
      usePricingStore.setState({
        totals: null,
        optimistic: null,
        lastKnown: null,
        status: "idle",
        lastError: undefined,
      });
      resetPricingSignature();
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("covers critical builder interactions", async () => {
    renderBuilder();

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByLabelText(/Color/i));
    fireEvent.click(screen.getByLabelText(/Option/i));
    fireEvent.click(screen.getByLabelText(/Presets/i));

    await waitFor(() => expect(screen.getByTestId("panel-product-color")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId("option-panel")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId("preset-bar")).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText(/Set product color to Sunset/i));
    await screen.findByText(/Active UI color: #FF6B6B/i);

    fireEvent.click(screen.getByLabelText(/Rear Spoiler/i));
    await waitFor(() => expect(screen.getByTestId("spoiler-attachment")).toBeInTheDocument());
    expect(screen.getByTestId("smoke-scene").getAttribute("data-option-spoiler")).toBe("true");

    await waitFor(() => expect(screen.getByText(/Dev Estimate/)).toBeInTheDocument());
    expect(screen.getAllByText(/₩/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText(/Save Blueprint/i));
    await screen.findByText(/Saved current configuration\./i);

    fireEvent.click(screen.getByLabelText(/Set product color to Ocean/i));
    fireEvent.click(screen.getByLabelText(/Rear Spoiler/i));
    await waitFor(() =>
      expect(screen.getByTestId("smoke-scene").getAttribute("data-option-spoiler")).toBe("false")
    );

    fireEvent.click(screen.getByText(/Load Blueprint/i));
    await screen.findByText(/Loaded the last saved configuration\./i);
    await screen.findByText(/Active UI color: #FF6B6B/i);

    fireEvent.click(screen.getByTestId("copy-share-link"));
    await waitFor(() => expect(clipboardMock).toHaveBeenCalledTimes(1));
    expect(clipboardMock).toHaveBeenNthCalledWith(1, expect.stringContaining("?blueprint="));

    fireEvent.click(screen.getByText(/Export markdown/i));
    await waitFor(() => expect(clipboardMock).toHaveBeenCalledTimes(2));
    expect(clipboardMock).toHaveBeenLastCalledWith(
        expect.stringContaining("# Configurator Estimate")
    );
    await screen.findByText(/Markdown copied to clipboard\./i);
  });
});
