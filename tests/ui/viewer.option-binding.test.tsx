import { describe, it, beforeEach, afterEach, expect } from "vitest";
import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";
import SceneCanvas, { ViewerSceneProvider } from "@/components/viewer/SceneCanvas";
import OptionPanel from "@/components/panels/OptionPanel";
import { useBuilderStore } from "@/lib/store/builder";
import { useRuntimeStore } from "@/lib/store/runtime";

describe("Viewer option binding", () => {
  beforeEach(() => {
    act(() => {
      useBuilderStore.getState().reset();
      useBuilderStore.setState((state) => ({
        ...state,
        toggles: {
          ...state.toggles,
          option: true,
        },
      }));
      useRuntimeStore.setState({
        activeOptions: {
          spoiler: false,
          roofRack: false,
        },
      });
    });
  });

  afterEach(() => {
    act(() => {
      useBuilderStore.getState().reset();
      useRuntimeStore.setState({
        activeOptions: {
          spoiler: false,
          roofRack: false,
        },
      });
    });
  });

  it("adds and removes spoiler geometry when toggled", async () => {
    render(
      <ViewerSceneProvider>
        <SceneCanvas />
        <OptionPanel />
      </ViewerSceneProvider>
    );

    expect(screen.queryByTestId("spoiler-attachment")).not.toBeInTheDocument();

    const spoilerToggle = screen.getByLabelText(/Rear Spoiler/i);
    fireEvent.click(spoilerToggle);

    expect(useBuilderStore.getState().params.options?.spoiler).toBe(true);
    await waitFor(() =>
      expect(useRuntimeStore.getState().activeOptions.spoiler).toBe(true)
    );
    await waitFor(() =>
      expect(screen.getByTestId("spoiler-attachment")).toBeInTheDocument()
    );

    fireEvent.click(spoilerToggle);
    await waitFor(() =>
      expect(screen.queryByTestId("spoiler-attachment")).not.toBeInTheDocument()
    );
    expect(useRuntimeStore.getState().activeOptions.spoiler).toBe(false);
  });

  it("renders roof rack geometry when enabled", async () => {
    render(
      <ViewerSceneProvider>
        <SceneCanvas />
        <OptionPanel />
      </ViewerSceneProvider>
    );

    expect(screen.queryByTestId("roofrack-attachment")).not.toBeInTheDocument();

    const roofRackToggle = screen.getByLabelText(/Roof Rack/i);
    fireEvent.click(roofRackToggle);

    expect(useBuilderStore.getState().params.options?.roofRack).toBe(true);
    await waitFor(() =>
      expect(useRuntimeStore.getState().activeOptions.roofRack).toBe(true)
    );
    await waitFor(() =>
      expect(screen.getByTestId("roofrack-attachment")).toBeInTheDocument()
    );
  });
});
