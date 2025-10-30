import { describe, it, beforeEach, afterEach, expect, beforeAll, afterAll, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ViewerSceneProvider } from "@/components/viewer/SceneCanvas";
import ColorPanel from "@/components/panels/ColorPanel";
import OptionPanel from "@/components/panels/OptionPanel";
import SceneCanvas from "@/components/viewer/SceneCanvas";
import { useBuilderStore, type FeatureKey } from "@/lib/store/builder";
import { useRuntimeStore } from "@/lib/store/runtime";

function enable(key: FeatureKey) {
  act(() => {
    useBuilderStore.getState().setToggle(key, true);
  });
}

describe("Viewer bindings", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterAll(() => {
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

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

  it("updates scene background when runtime store changes", () => {
    render(
      <ViewerSceneProvider>
        <SceneCanvas />
      </ViewerSceneProvider>
    );

    const canvas = screen.getByTestId("scene-canvas");
    act(() => {
      useRuntimeStore.getState().setBackgroundColor("#0ea5e9");
    });

    expect(canvas).toHaveStyle({ backgroundColor: "#0ea5e9" });
  });
});
