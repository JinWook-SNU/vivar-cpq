import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import EnvironmentSettings from "@/components/cpq/EnvironmentSettings";
import { useBuilderStore, DEFAULT_ENVIRONMENT } from "@/lib/store/builder";
import { useRuntimeStore } from "@/lib/store/runtime";

describe("EnvironmentSettings", () => {
  beforeEach(() => {
    act(() => {
      useBuilderStore.getState().reset();
      useRuntimeStore.setState({
        backgroundColor: DEFAULT_ENVIRONMENT.backgroundColor,
        productColor: useRuntimeStore.getState().productColor,
      });
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders swatches and marks the active background", () => {
    render(<EnvironmentSettings />);

    const defaultButton = screen.getByLabelText(
      `Set environment background to ${DEFAULT_ENVIRONMENT.backgroundColor}`
    );
    expect(defaultButton).toHaveAttribute("aria-pressed", "true");
  });

  it("updates builder and runtime state when selecting a swatch", () => {
    render(<EnvironmentSettings />);

    const targetHex = "#0ea5e9";
    const swatch = screen.getByLabelText(`Set environment background to ${targetHex}`);
    fireEvent.click(swatch);

    expect(useBuilderStore.getState().environment.backgroundColor).toBe(targetHex);
    expect(useRuntimeStore.getState().backgroundColor).toBe(targetHex);
    expect(swatch).toHaveAttribute("aria-pressed", "true");
  });
});
