import { describe, it, beforeEach, afterEach, expect } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ViewerSceneProvider } from "@/components/viewer/SceneCanvas";
import ColorPanel from "@/components/panels/ColorPanel";
import OptionPanel from "@/components/panels/OptionPanel";
import SceneCanvas from "@/components/viewer/SceneCanvas";
import { useBuilderStore } from "@/lib/store/builder";
import { useRuntimeStore } from "@/lib/store/runtime";

function enable(key: Parameters<typeof useBuilderStore.setState>[0]["toggles"] extends infer T ? keyof T : never) {
  act(() => {
    useBuilderStore.setState((state) => ({
      ...state,
      toggles: { ...state.toggles, [key]: true },
    }));
  });
}

describe("Viewer bindings", () => {
  beforeEach(() => {
    act(() => useBuilderStore.getState().reset());
  });

  afterEach(() => {
    act(() => useBuilderStore.getState().reset());
    document.body.innerHTML = "";
  });

  it("reflects color panel changes in scene", () => {
    enable("color");
    render(
      <ViewerSceneProvider>
        <SceneCanvas />
        <ColorPanel />
      </ViewerSceneProvider>
    );

    fireEvent.click(screen.getByLabelText(/Sunset/i));

    const canvas = screen.getByTestId("scene-canvas");
    const runtimeState = useRuntimeStore.getState();
    expect(runtimeState.productColor).toBe("#ff6b6b");
    expect(runtimeState.backgroundColor).not.toBe("#ff6b6b");
    expect(Number(canvas.getAttribute("data-fps"))).toBeGreaterThanOrEqual(60);
  });

  it("reflects option toggles in scene", () => {
    enable("option");
    render(
      <ViewerSceneProvider>
        <SceneCanvas />
        <OptionPanel />
      </ViewerSceneProvider>
    );

    fireEvent.click(screen.getByLabelText(/Rear Spoiler/i));

    const canvas = screen.getByTestId("scene-canvas");
    expect(canvas.dataset.optionSpoiler).toBe("true");
  });
});
