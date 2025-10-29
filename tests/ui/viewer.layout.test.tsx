import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import ConfiguratorShell from "@/components/cpq/ConfiguratorShell";
import { useBuilderStore } from "@/lib/store/builder";

const renderShell = (toggles: Record<string, boolean>) => render(<ConfiguratorShell toggles={toggles} />);

describe("ConfiguratorShell layout", () => {
  beforeEach(() => {
    act(() => useBuilderStore.getState().reset());
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a single scene canvas with layout containers", async () => {
    renderShell({});
    expect(screen.getByTestId("config-shell")).toBeInTheDocument();
    expect(screen.getByTestId("shell-viewer")).toBeInTheDocument();
    expect(screen.getByTestId("shell-panels")).toBeInTheDocument();
    const canvas = await screen.findAllByTestId("scene-canvas");
    expect(canvas).toHaveLength(1);
  });

  it("shows overlays when utilities enabled", async () => {
    renderShell({ dimension: true, fullscreen: true, screenshot: true, ar: true });
    await screen.findByTestId("scene-canvas");
    expect(screen.getByTestId("util-dimension")).toBeInTheDocument();
    expect(screen.getByTestId("util-fullscreen")).toBeInTheDocument();
    expect(screen.getByTestId("util-screenshot")).toBeInTheDocument();
    expect(screen.getByTestId("util-ar")).toBeInTheDocument();
  });

  it("renders panels inside panel container", async () => {
    act(() => {
      useBuilderStore.setState((state) => ({
        ...state,
        toggles: {
          ...state.toggles,
          color: true,
          option: true,
          preset: true,
          aiCatalog: true,
        },
      }));
    });
    renderShell({ color: true, option: true, preset: true, aiCatalog: true });
    await screen.findByTestId("scene-canvas");
    const panels = screen.getByTestId("shell-panels");
    expect(panels).toContainElement(screen.getByTestId("panel-product-color"));
    expect(panels).toContainElement(screen.getByTestId("panel-options"));
    expect(panels).toContainElement(screen.getByTestId("panel-presets"));
    expect(panels).toContainElement(screen.getByTestId("panel-ai-catalog"));
    expect(panels).toContainElement(screen.getByTestId("panel-ai-suggestions"));
  });
});
