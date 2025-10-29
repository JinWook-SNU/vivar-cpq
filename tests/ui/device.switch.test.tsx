import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import Page, { VIEWPORT_TRANSITION_MS } from "@/app/cpq-builder/page";

const fpsState = { fps: 75, warning: false };

vi.mock("@/lib/metrics/fps", async () => {
  const actual = await vi.importActual<typeof import("@/lib/metrics/fps")>("@/lib/metrics/fps");
  return {
    ...actual,
    useFpsStatus: () => fpsState,
  };
});

describe("Device switch accessibility", () => {
  beforeEach(() => {
    fpsState.fps = 75;
    fpsState.warning = false;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  it("moves focus to the mobile primary action after transition", () => {
    render(<Page />);

    const mobileToggle = screen.getByRole("button", { name: /mobile/i });
    act(() => {
      fireEvent.click(mobileToggle);
    });

    act(() => {
      vi.advanceTimersByTime(VIEWPORT_TRANSITION_MS);
    });

    expect(document.activeElement).toHaveAttribute("data-device-primary", "mobile");
  });

  it("surfaces fps badge when transitioning below 60 fps", () => {
    fpsState.fps = 45;
    fpsState.warning = true;

    render(<Page />);

    const mobileToggle = screen.getByRole("button", { name: /mobile/i });
    act(() => {
      fireEvent.click(mobileToggle);
    });

    expect(screen.getByTestId("fps-alert")).toBeInTheDocument();
    act(() => {
      vi.runAllTimers();
    });
  });
});
