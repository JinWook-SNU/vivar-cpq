import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Page from "@/app/cpq-builder/page";
import { useBuilderStore, DEFAULT_ENVIRONMENT } from "@/lib/store/builder";
import { useRuntimeStore } from "@/lib/store/runtime";

describe("Builder environment settings", () => {
  beforeEach(() => {
    act(() => {
      useBuilderStore.getState().reset();
      useRuntimeStore.setState((state) => ({
        ...state,
        backgroundColor: DEFAULT_ENVIRONMENT.backgroundColor,
      }));
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders builder environment controls and keeps preview in sync", () => {
    render(<Page />);

    const builderEnv = screen.getByTestId("builder-env-bg");
    expect(builderEnv).toBeInTheDocument();

    const canvasList = screen.getAllByTestId("scene-canvas");
    expect(canvasList).toHaveLength(1);
    expect(screen.queryByTestId("panel-bg-color")).toBeNull();

    const targetHex = "#ffffff";
    const swatch = screen.getByLabelText(`Set environment background to ${targetHex}`);
    fireEvent.click(swatch);

    expect(useBuilderStore.getState().environment.backgroundColor).toBe(targetHex);
    expect(useRuntimeStore.getState().backgroundColor).toBe(targetHex);
  });
});
