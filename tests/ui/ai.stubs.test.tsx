import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import AIStubs from "@/components/cpq/AIStubs";
import FeatureToggles from "@/components/cpq/FeatureToggles";
import { useBuilderStore } from "@/lib/store/builder";

describe("AI stubs", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    act(() => {
      useBuilderStore.getState().reset();
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    act(() => {
      useBuilderStore.getState().reset();
    });
    document.body.innerHTML = "";
  });

  it("shows disabled messaging when AI toggles are off", () => {
    render(<AIStubs />);

    expect(screen.getByTestId("ai-suggestions-disabled")).toBeInTheDocument();
    expect(screen.getByTestId("ai-catalog-disabled")).toBeInTheDocument();
  });

  it("renders loading skeletons before showing AI content", async () => {
    act(() => {
      useBuilderStore.setState((state) => ({
        ...state,
        toggles: {
          ...state.toggles,
          aiSuggestions: true,
          aiCatalog: true,
        },
      }));
    });

    render(<AIStubs />);

    expect(screen.getByTestId("ai-suggestions-loading")).toBeInTheDocument();
    expect(screen.getByTestId("ai-catalog-loading")).toBeInTheDocument();

    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByTestId("ai-suggestions-chips")).toBeInTheDocument();
    expect(screen.getByTestId("ai-catalog-card")).toBeInTheDocument();
  });

  it("exposes AI stub entry points in feature toggles", () => {
    act(() => {
      useBuilderStore.setState((state) => ({
        ...state,
        toggles: {
          ...state.toggles,
          aiSuggestions: true,
          aiCatalog: false,
        },
      }));
    });

    render(<FeatureToggles />);

    const entrypoints = screen.getByTestId("ai-entrypoints");
    expect(entrypoints).toBeInTheDocument();
    expect(entrypoints.querySelectorAll("button")).toHaveLength(1);
  });
});
