import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Page from "@/app/cpq-builder/page";
import { useBuilderStore, DEFAULT_OPTIONS } from "@/lib/store/builder";
import { useRuntimeStore } from "@/lib/store/runtime";

describe("Preview/product color separation", () => {
  beforeEach(() => {
    act(() => {
      useBuilderStore.getState().reset();
      useBuilderStore.setState((state) => ({
        ...state,
        toggles: { ...state.toggles, color: true },
        params: {
          ...state.params,
          options: { ...DEFAULT_OPTIONS },
        },
      }));
      useRuntimeStore.setState((state) => ({
        ...state,
        productColor: "#51cf66",
      }));
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("shows only product color panel in preview and updates runtime store", () => {
    render(<Page />);

    const canvasList = screen.getAllByTestId("scene-canvas");
    expect(canvasList).toHaveLength(1);
    expect(screen.queryByTestId("panel-bg-color")).toBeNull();

    const productPanel = screen.getByTestId("panel-product-color");
    expect(productPanel).toBeInTheDocument();

    const sunsetSwatch = screen.getByLabelText(/Set product color to Sunset/i);
    fireEvent.click(sunsetSwatch);

    expect(useBuilderStore.getState().params.color?.hex).toBe("#ff6b6b");
    expect(useRuntimeStore.getState().productColor).toBe("#ff6b6b");
  });
});
