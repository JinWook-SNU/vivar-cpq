import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import DimensionHUD from "@/components/viewer/DimensionHUD";
import FullscreenButton from "@/components/viewer/FullscreenButton";
import ScreenshotButton from "@/components/viewer/ScreenshotButton";
import ARButton from "@/components/viewer/ARButton";
import { useBuilderStore, type FeatureKey } from "@/lib/store/builder";

function enableToggle(key: FeatureKey) {
  act(() => {
    useBuilderStore.getState().setToggle(key, true);
  });
}

describe("Viewer utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      useBuilderStore.getState().reset();
    });
  });

  afterEach(() => {
    act(() => {
      useBuilderStore.getState().reset();
    });
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("renders dimension HUD when toggle enabled", () => {
    enableToggle("dimension");
    render(<DimensionHUD />);
    expect(screen.getByTestId("dimension-hud")).toBeInTheDocument();
  });

  it("requests fullscreen on click", async () => {
    enableToggle("fullscreen");
    const request = vi.fn().mockResolvedValue(undefined);
    document.documentElement.requestFullscreen = request;
    document.exitFullscreen = vi.fn();
    render(<FullscreenButton />);
    fireEvent.click(screen.getByTestId("fullscreen-button"));
    expect(request).toHaveBeenCalled();
  });

  it("captures screenshot via canvas", () => {
    enableToggle("screenshot");
    const canvas = document.createElement("canvas");
    const toDataURL = vi.fn().mockReturnValue("data:image/png;base64,xyz");
    (canvas as HTMLCanvasElement & { toDataURL: () => string }).toDataURL = toDataURL;
    document.body.appendChild(canvas);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    render(<ScreenshotButton />);
    fireEvent.click(screen.getByTestId("screenshot-button"));
    expect(toDataURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("Screenshot"));
  });

  it("shows AR placeholder dialog", () => {
    enableToggle("ar");
    render(<ARButton />);
    fireEvent.click(screen.getByTestId("ar-button"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByText(/close/i));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
