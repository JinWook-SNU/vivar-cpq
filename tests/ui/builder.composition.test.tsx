import { describe, it, expect } from "vitest";
import { act, render, screen } from "@testing-library/react";
import ConfiguratorShell from "@/components/cpq/ConfiguratorShell";
import { useBuilderStore } from "@/lib/store/builder";

const renderShell = (toggles: Record<string, boolean>) => render(<ConfiguratorShell toggles={toggles} />);

describe("ConfiguratorShell composition", () => {
  beforeEach(() => {
    act(() => {
      useBuilderStore.getState().reset();
    });
  });

  it("renders no utilities or panels when toggles are false", async () => {
    renderShell({});
    await screen.findByTestId("scene-canvas");
    expect(screen.queryByTestId("dimension-hud")).toBeNull();
    expect(screen.queryByTestId("panel-product-color")).toBeNull();
    expect(screen.getAllByTestId("scene-canvas")).toHaveLength(1);
    expect(screen.getByTestId("config-shell")).toBeInTheDocument();
    expect(screen.getByTestId("shell-viewer")).toBeInTheDocument();
    expect(screen.getByTestId("shell-panels")).toBeInTheDocument();
  });

  it("shows a utility when toggled on", async () => {
    act(() => {
      useBuilderStore.setState((state) => ({
        ...state,
        toggles: { ...state.toggles, dimension: true },
      }));
    });
    renderShell({ dimension: true });
    await screen.findByTestId("dimension-hud");
    expect(screen.getByTestId("util-dimension")).toBeInTheDocument();
  });

  it("renders color and option panels when enabled", async () => {
    act(() => {
      useBuilderStore.setState((state) => ({
        ...state,
        toggles: { ...state.toggles, color: true, option: true },
      }));
    });
    renderShell({ color: true, option: true });
    await screen.findByTestId("panel-product-color");
    expect(screen.getByTestId("option-panel")).toBeInTheDocument();
  });

  it("auto enables ai suggestions when catalog requested", async () => {
    act(() => {
      useBuilderStore.setState((state) => ({
        ...state,
        toggles: { ...state.toggles, aiCatalog: true },
      }));
    });
    renderShell({ aiCatalog: true });
    await screen.findByTestId("ai-catalog-card");
    expect(screen.getByTestId("ai-suggestions-chips")).toBeInTheDocument();
  });
});
