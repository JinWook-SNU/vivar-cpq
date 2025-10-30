import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import ConfiguratorShell from "@/components/cpq/ConfiguratorShell";
import { useBuilderStore } from "@/lib/store/builder";

const renderShell = (toggles: Record<string, boolean>) => render(<ConfiguratorShell toggles={toggles} />);

describe("ConfiguratorShell layout", () => {
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
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a single scene canvas with layout containers", async () => {
    renderShell({});
    expect(screen.getByTestId("config-shell")).toBeInTheDocument();
    expect(screen.getByTestId("shell-viewer")).toBeInTheDocument();
    const panelContainer = screen.getByTestId("shell-panels");
    expect(panelContainer).toBeInTheDocument();
    expect(panelContainer).toHaveAttribute("aria-hidden", "true");
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
      const builder = useBuilderStore.getState();
      builder.setToggle("color", true);
      builder.setToggle("option", true);
      builder.setToggle("preset", true);
      builder.setToggle("aiCatalog", true);
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
